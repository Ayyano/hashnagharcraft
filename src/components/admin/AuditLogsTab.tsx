import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  ShieldCheck,
  Calendar,
  User,
} from 'lucide-react';
import { AuditLog } from '../../types.ts';

interface AuditLogsTabProps {
  token: string;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.adminEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Administrative & Financial Audit Trail
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Immutable log of all product catalog edits, pricing adjustments, website publishing actions, logins, and manual financial entries.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1C1917] bg-[#FAF8F5] border border-[#D6D3D1] rounded-md hover:bg-neutral-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-4 shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by action, keyword, or administrator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-[#FAF8F5] focus:bg-white focus:outline-none"
          />
        </div>
        <span className="text-xs text-[#78716C]">{filteredLogs.length} logged events</span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-[#78716C] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Details & Parameters</th>
                <th className="py-3 px-4 text-right">Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2DA]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#78716C]">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#78716C] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[#92400E]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#1C1917] max-w-lg leading-relaxed">
                      {log.details}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[11px] text-[#57534E]">
                      {log.adminEmail}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
