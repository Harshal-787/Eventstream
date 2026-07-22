import { useState, useEffect } from "react";
import apiClient from "../../../services/apiClient";
import { Box } from "../../../components/ui/Box";
import { Button } from "../../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (pageToFetch) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/audit-logs?page=${pageToFetch}&limit=${limit}`);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!logs.length) return;
    
    // Define headers
    const headers = ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Details", "IP Address"];
    
    // Create CSV rows
    const csvRows = logs.map(log => {
      const timestamp = new Date(log.created_at).toISOString();
      const user = log.user_name ? `${log.user_name} (${log.user_role})` : "System";
      const action = log.action;
      const entityType = log.entity_type;
      const entityId = log.entity_id || "";
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : "";
      const ip = log.ip_address || "";
      
      return `"${timestamp}","${user}","${action}","${entityType}","${entityId}","${details}","${ip}"`;
    });
    
    // Combine headers and rows
    const csvString = [headers.join(","), ...csvRows].join("\n");
    
    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            Audit Logs
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            System activity and security events
          </p>
        </div>
        <Button onClick={downloadCSV} variant="primary" disabled={logs.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No activity logged yet.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-surface border-b border-border-main">
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Timestamp</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">User</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Action</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Entity</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Details</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-main">
                {logs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    as={motion.tr}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <TableCell className="py-4 whitespace-nowrap text-sm font-medium text-text-muted">
                      {new Date(log.created_at).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-sm text-text-main">
                        {log.user_name || "System"} 
                      </div>
                      {log.user_role && <div className="text-xs text-text-muted font-semibold capitalize">{log.user_role}</div>}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-md font-bold text-[11px] uppercase tracking-wider">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-bold text-sm text-text-main">{log.entity_type}</span> {log.entity_id && <span className="text-xs font-medium text-text-muted">#{log.entity_id}</span>}
                    </TableCell>
                    <TableCell className="py-4 align-top min-w-[300px]">
                      {(!log.details || Object.keys(log.details).length === 0) ? (
                          <span className="text-text-muted italic text-sm">No additional details</span>
                      ) : (
                          <div className="flex flex-col gap-2">
                              {Object.entries(log.details).map(([key, value]) => {
                                  if (value === null || value === '' || value === undefined) return null;
                                  
                                  let displayValue = value;
                                  if (typeof value === 'object') {
                                      displayValue = JSON.stringify(value);
                                  } else if (typeof value === 'boolean') {
                                      displayValue = value ? 'True' : 'False';
                                  }
                                  
                                  return (
                                      <div key={key} className="flex flex-col bg-slate-50 dark:bg-surface p-2.5 border border-slate-200 dark:border-border-main rounded-xl text-xs">
                                          <span className="font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">{key.replace(/_/g, ' ')}</span>
                                          <span className="font-mono text-teal-600 dark:text-teal-400 break-all">{displayValue}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-text-muted">
                      {log.ip_address || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-border-main bg-slate-50 dark:bg-surface flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <span className="text-text-muted font-medium">
            Showing <span className="font-bold text-text-main">{(page - 1) * limit + 1}</span> to <span className="font-bold text-text-main">{Math.min(page * limit, total)}</span> of <span className="font-bold text-text-main">{total}</span> entries
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="rounded-lg h-auto py-2 text-xs font-semibold"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg h-auto py-2 text-xs font-semibold"
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
