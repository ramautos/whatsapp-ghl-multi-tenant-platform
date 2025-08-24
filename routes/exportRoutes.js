// 📊 RUTAS DE EXPORTACIÓN DE CONVERSACIONES
// Permite exportar conversaciones en diferentes formatos

const express = require('express');
const router = express.Router();
const db = require('../config/database-sqlite');
const path = require('path');
const fs = require('fs').promises;

// ================================
// EXPORTAR CONVERSACIONES POR CLIENTE
// ================================

router.get('/conversations/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const { 
            format = 'json',
            from_date,
            to_date,
            limit = 1000,
            include_media = false
        } = req.query;

        // Validar formato
        const validFormats = ['json', 'csv', 'txt'];
        if (!validFormats.includes(format)) {
            return res.status(400).json({
                error: `Invalid format. Use: ${validFormats.join(', ')}`
            });
        }

        // Construir query de mensajes
        let whereConditions = ['ml.location_id = ?'];
        let queryParams = [locationId];

        if (from_date) {
            whereConditions.push('ml.processed_at >= ?');
            queryParams.push(from_date);
        }

        if (to_date) {
            whereConditions.push('ml.processed_at <= ?');
            queryParams.push(to_date);
        }

        const query = `
            SELECT 
                ml.message_id,
                ml.location_id,
                ml.instance_name,
                ml.from_number,
                ml.from_name,
                ml.message_type,
                ml.content,
                ml.processed_at,
                ml.direction,
                ml.status,
                ml.ghl_conversation_id,
                wi.position as whatsapp_position,
                c.name as client_name
            FROM message_logs ml
            LEFT JOIN whatsapp_instances wi ON ml.instance_name = wi.instance_name
            LEFT JOIN clients c ON ml.location_id = c.location_id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY ml.processed_at DESC
            LIMIT ?
        `;

        queryParams.push(parseInt(limit));

        const [messages] = await db.query(query, queryParams);

        if (!messages.length) {
            return res.status(404).json({
                error: 'No messages found for the specified criteria'
            });
        }

        // Generar archivo según formato
        const exportData = await generateExport(messages, format, {
            locationId,
            clientName: messages[0].client_name,
            dateRange: { from_date, to_date },
            totalMessages: messages.length,
            includeMedia: include_media === 'true'
        });

        // Configurar headers de descarga
        const filename = `conversations_${locationId}_${new Date().toISOString().split('T')[0]}.${format}`;
        res.setHeader('Content-Type', getContentType(format));
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.send(exportData);

        // Log de exportación
        console.log(`📊 Conversation export: ${locationId} (${format}, ${messages.length} messages)`);

    } catch (error) {
        console.error('❌ Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// EXPORTAR ESTADÍSTICAS DEL CLIENTE
// ================================

router.get('/stats/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const { days = 30, format = 'json' } = req.query;

        // Estadísticas de mensajes por día
        const [dailyStats] = await db.query(`
            SELECT 
                DATE(processed_at) as date,
                COUNT(*) as total_messages,
                COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as received_messages,
                COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as sent_messages,
                COUNT(DISTINCT from_number) as unique_contacts
            FROM message_logs
            WHERE location_id = ? 
            AND processed_at >= date('now', '-${days} days')
            GROUP BY DATE(processed_at)
            ORDER BY date DESC
        `, [locationId]);

        // Estadísticas por tipo de mensaje
        const [messageTypes] = await db.query(`
            SELECT 
                message_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
            FROM message_logs
            WHERE location_id = ? 
            AND processed_at >= date('now', '-${days} days')
            GROUP BY message_type
            ORDER BY count DESC
        `, [locationId]);

        // Estadísticas por instancia
        const [instanceStats] = await db.query(`
            SELECT 
                wi.position,
                wi.instance_name,
                wi.status,
                COUNT(ml.message_id) as messages_count,
                MAX(ml.processed_at) as last_message
            FROM whatsapp_instances wi
            LEFT JOIN message_logs ml ON wi.instance_name = ml.instance_name 
                AND ml.processed_at >= date('now', '-${days} days')
            WHERE wi.location_id = ?
            GROUP BY wi.instance_name
            ORDER BY wi.position
        `, [locationId]);

        // Contactos más activos
        const [topContacts] = await db.query(`
            SELECT 
                from_number,
                from_name,
                COUNT(*) as message_count,
                MAX(processed_at) as last_message,
                MIN(processed_at) as first_message
            FROM message_logs
            WHERE location_id = ? 
            AND processed_at >= date('now', '-${days} days')
            AND direction = 'inbound'
            GROUP BY from_number
            ORDER BY message_count DESC
            LIMIT 10
        `, [locationId]);

        const statsData = {
            location_id: locationId,
            period: `${days} days`,
            generated_at: new Date().toISOString(),
            summary: {
                total_messages: dailyStats.reduce((sum, day) => sum + day.total_messages, 0),
                total_received: dailyStats.reduce((sum, day) => sum + day.received_messages, 0),
                total_sent: dailyStats.reduce((sum, day) => sum + day.sent_messages, 0),
                unique_contacts: new Set(topContacts.map(c => c.from_number)).size,
                active_days: dailyStats.length
            },
            daily_stats: dailyStats,
            message_types: messageTypes,
            instance_stats: instanceStats,
            top_contacts: topContacts
        };

        if (format === 'csv') {
            const csvData = convertStatsToCSV(statsData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="stats_${locationId}.csv"`);
            res.send(csvData);
        } else {
            res.json(statsData);
        }

    } catch (error) {
        console.error('❌ Stats export error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// EXPORTAR TODO EL SISTEMA (ADMIN)
// ================================

router.get('/admin/full-export', async (req, res) => {
    try {
        const { format = 'json', include_messages = false } = req.query;

        console.log('🔐 Admin full export requested');

        // Datos de clientes
        const [clients] = await db.query(`
            SELECT 
                c.*,
                gi.company_name,
                gi.access_token is not null as has_ghl_integration,
                COUNT(wi.id) as total_instances,
                COUNT(CASE WHEN wi.status = 'connected' THEN 1 END) as connected_instances
            FROM clients c
            LEFT JOIN ghl_installations gi ON c.location_id = gi.location_id
            LEFT JOIN whatsapp_instances wi ON c.location_id = wi.location_id
            GROUP BY c.location_id
            ORDER BY c.registered_at DESC
        `);

        // Estadísticas por cliente
        const [clientStats] = await db.query(`
            SELECT 
                ml.location_id,
                COUNT(*) as total_messages,
                COUNT(CASE WHEN DATE(ml.processed_at) = DATE('now') THEN 1 END) as messages_today,
                COUNT(DISTINCT ml.from_number) as unique_contacts,
                MAX(ml.processed_at) as last_activity
            FROM message_logs ml
            GROUP BY ml.location_id
        `);

        // Estadísticas de instancias
        const [instanceStats] = await db.query(`
            SELECT 
                location_id,
                COUNT(*) as total_instances,
                COUNT(CASE WHEN status = 'connected' THEN 1 END) as connected,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as open_instances,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_instances
            FROM whatsapp_instances
            GROUP BY location_id
        `);

        const exportData = {
            export_info: {
                generated_at: new Date().toISOString(),
                platform_version: '1.0.0',
                export_type: 'full_admin_export'
            },
            summary: {
                total_clients: clients.length,
                total_instances: instanceStats.reduce((sum, stat) => sum + stat.total_instances, 0),
                total_messages: clientStats.reduce((sum, stat) => sum + stat.total_messages, 0)
            },
            clients: clients.map(client => {
                const stats = clientStats.find(s => s.location_id === client.location_id);
                const instances = instanceStats.find(s => s.location_id === client.location_id);
                
                return {
                    ...client,
                    statistics: stats || {},
                    instance_summary: instances || {}
                };
            })
        };

        // Incluir mensajes si se solicita (solo para exports pequeños)
        if (include_messages === 'true' && clients.length <= 5) {
            const [allMessages] = await db.query(`
                SELECT * FROM message_logs 
                WHERE processed_at >= date('now', '-7 days')
                ORDER BY processed_at DESC
                LIMIT 1000
            `);
            exportData.recent_messages = allMessages;
        }

        const filename = `platform_export_${new Date().toISOString().split('T')[0]}.${format}`;
        
        if (format === 'csv') {
            const csvData = convertFullExportToCSV(exportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csvData);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.json(exportData);
        }

        console.log(`📊 Full admin export completed: ${clients.length} clients`);

    } catch (error) {
        console.error('❌ Full export error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ================================
// FUNCIONES AUXILIARES
// ================================

async function generateExport(messages, format, metadata) {
    switch (format) {
        case 'json':
            return JSON.stringify({
                metadata,
                messages
            }, null, 2);
            
        case 'csv':
            return convertMessagesToCSV(messages, metadata);
            
        case 'txt':
            return convertMessagesToText(messages, metadata);
            
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

function convertMessagesToCSV(messages, metadata) {
    const headers = [
        'Date', 'Time', 'Direction', 'From', 'Name', 
        'Type', 'Content', 'WhatsApp Position', 'Status'
    ];
    
    let csv = `# Conversation Export - ${metadata.clientName}\n`;
    csv += `# Location ID: ${metadata.locationId}\n`;
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `# Total Messages: ${metadata.totalMessages}\n\n`;
    
    csv += headers.join(',') + '\n';
    
    messages.forEach(msg => {
        const date = new Date(msg.processed_at);
        const row = [
            date.toISOString().split('T')[0],
            date.toTimeString().split(' ')[0],
            msg.direction,
            msg.from_number,
            `"${msg.from_name || ''}"`,
            msg.message_type,
            `"${msg.content.replace(/"/g, '""')}"`,
            msg.whatsapp_position || '',
            msg.status
        ];
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

function convertMessagesToText(messages, metadata) {
    let text = `CONVERSACIONES WHATSAPP\n`;
    text += `========================\n\n`;
    text += `Cliente: ${metadata.clientName}\n`;
    text += `Location ID: ${metadata.locationId}\n`;
    text += `Exportado: ${new Date().toLocaleString()}\n`;
    text += `Total de mensajes: ${metadata.totalMessages}\n\n`;
    
    let currentDate = '';
    
    messages.forEach(msg => {
        const msgDate = new Date(msg.processed_at);
        const dateStr = msgDate.toLocaleDateString();
        
        if (dateStr !== currentDate) {
            text += `\n--- ${dateStr} ---\n\n`;
            currentDate = dateStr;
        }
        
        const time = msgDate.toLocaleTimeString();
        const direction = msg.direction === 'inbound' ? '←' : '→';
        const sender = msg.from_name || msg.from_number;
        
        text += `[${time}] ${direction} ${sender}: ${msg.content}\n`;
    });
    
    return text;
}

function convertStatsToCSV(statsData) {
    let csv = `Statistics Export,${statsData.location_id}\n`;
    csv += `Period,${statsData.period}\n`;
    csv += `Generated,${statsData.generated_at}\n\n`;
    
    // Summary
    csv += `SUMMARY\n`;
    csv += `Total Messages,${statsData.summary.total_messages}\n`;
    csv += `Received,${statsData.summary.total_received}\n`;
    csv += `Sent,${statsData.summary.total_sent}\n`;
    csv += `Unique Contacts,${statsData.summary.unique_contacts}\n\n`;
    
    // Daily stats
    csv += `DAILY STATISTICS\n`;
    csv += `Date,Total,Received,Sent,Contacts\n`;
    statsData.daily_stats.forEach(day => {
        csv += `${day.date},${day.total_messages},${day.received_messages},${day.sent_messages},${day.unique_contacts}\n`;
    });
    
    return csv;
}

function convertFullExportToCSV(exportData) {
    let csv = `Platform Export,${exportData.export_info.generated_at}\n\n`;
    
    csv += `CLIENTS\n`;
    csv += `Location ID,Name,Company,Instances,Connected,Messages,Last Activity\n`;
    
    exportData.clients.forEach(client => {
        csv += [
            client.location_id,
            client.name || '',
            client.company_name || '',
            client.instance_summary.total_instances || 0,
            client.instance_summary.connected || 0,
            client.statistics.total_messages || 0,
            client.statistics.last_activity || ''
        ].join(',') + '\n';
    });
    
    return csv;
}

function getContentType(format) {
    switch (format) {
        case 'json': return 'application/json';
        case 'csv': return 'text/csv';
        case 'txt': return 'text/plain';
        default: return 'application/octet-stream';
    }
}

module.exports = router;