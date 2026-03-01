import { Link } from 'react-router-dom';
import { Star, Shield, FileText, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-500 p-1.5 rounded-lg">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-white">RateIt</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Trusted reviews for every service. Rate doctors, hospitals, companies, teachers and more with verified proof.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/sector/healthcare" className="hover:text-white transition-colors">Healthcare</Link></li>
              <li><Link to="/sector/education" className="hover:text-white transition-colors">Education</Link></li>
              <li><Link to="/sector/finance" className="hover:text-white transition-colors">Finance & Banking</Link></li>
              <li><Link to="/sector/legal" className="hover:text-white transition-colors">Legal Services</Link></li>
              <li><Link to="/sector/retail" className="hover:text-white transition-colors">Retail</Link></li>
              <li><Link to="/sector/technology" className="hover:text-white transition-colors">Technology</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Users</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Find Reviews</Link></li>
              <li><Link to="/add-entity" className="hover:text-white transition-colors">Add a Business</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">My Reviews</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal & Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Help Center
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; 2025 RateIt. All rights reserved.</p>
          <p className="text-sm text-gray-500">
            Empowering consumers with verified, transparent reviews.
          </p>
        </div>
      </div>
    </footer>
  );
}
