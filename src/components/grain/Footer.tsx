import React from 'react';
import { Bug, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Bug size={20} />
              </div>
              <span className="font-bold text-lg">NTS G.R.O.W</span>
            </div>
            <p className="text-slate-400 text-sm">
              Advanced pest monitoring and economic loss modeling for stored grain facilities worldwide.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Dashboard</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Grain Lots</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Inspections</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Reports</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Settings</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-1">FAO Guidelines <ExternalLink size={12} /></a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Pest Identification</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Loss Coefficients</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Best Practices</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">API Documentation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2"><Mail size={14} /> support@ntsgrow.com</li>
              <li className="flex items-center gap-2"><Phone size={14} /> +1 (555) 123-4567</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> Agricultural Tech Center</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">© 2025 NTS G.R.O.W / SeedLabs. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
