import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   Users,
   Truck,
   UtensilsCrossed,
   Stethoscope,
   Building2,
   ArrowRight,
   CheckCircle,
   Phone,
   Mail,
   MapPin,
   Star,
   Award,
   Clock,
   Shield,
   Loader2
} from 'lucide-react';
import { db } from '../../services/mockDb';
import { Company, Site, Employee } from '../../types';

export default function LandingPage() {
   const navigate = useNavigate();
   const [company, setCompany] = useState<Company | null>(null);
   const [sites, setSites] = useState<Site[]>([]);
   const [employees, setEmployees] = useState<Employee[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      try {
         const [companyData, sitesData, employeesData] = await Promise.all([
            db.getCompanyProfile(),
            db.getSites(),
            db.getEmployees()
         ]);

         setCompany(companyData);
         setSites(sitesData);
         setEmployees(employeesData);
      } catch (error) {
         console.error('Error loading landing page data:', error);
      } finally {
         setLoading(false);
      }
   };

   const services = [
      {
         icon: Users,
         title: 'Door to Door Code Collection',
         description: 'Efficient and reliable door-to-door collection services with trained professionals ensuring secure and timely pickups.',
         color: 'from-blue-500 to-blue-600'
      },
      {
         icon: Truck,
         title: 'Manpower Supply',
         description: 'Comprehensive workforce solutions providing skilled and unskilled labor for various industries with verified professionals.',
         color: 'from-purple-500 to-purple-600'
      },
      {
         icon: UtensilsCrossed,
         title: 'Canteen & Food Services',
         description: 'Quality food catering services for corporate offices, construction sites, and institutions with hygienic standards.',
         color: 'from-green-500 to-green-600'
      },
      {
         icon: Stethoscope,
         title: 'Hospital Diet Services',
         description: 'Specialized nutritional diet preparation and delivery services for hospitals and healthcare facilities.',
         color: 'from-red-500 to-red-600'
      },
      {
         icon: Building2,
         title: 'Facility Management',
         description: 'Complete facility management solutions including housekeeping, maintenance, and security services.',
         color: 'from-orange-500 to-orange-600'
      },
      {
         icon: Shield,
         title: 'Security Services',
         description: 'Professional security personnel deployment for residential, commercial, and industrial establishments.',
         color: 'from-indigo-500 to-indigo-600'
      }
   ];

   const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE' || emp.status === 'APPROVED');
   const activeSites = sites.length;

   const stats = [
      { value: `${activeSites}+`, label: 'Active Sites' },
      { value: `${activeEmployees.length}+`, label: 'Workforce Deployed' },
      { value: '10+', label: 'Years Experience' },
      { value: '24/7', label: 'Support Available' }
   ];

   const features = [
      'ISO Certified Company',
      'Trained & Verified Staff',
      'On-Time Service Delivery',
      'Affordable Pricing',
      'Quality Assurance',
      'Pan-India Presence'
   ];

   if (loading) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
               <p className="text-gray-600 font-medium">Loading...</p>
            </div>
         </div>
      );
   }

   const companyName = company?.name || 'Konark Services';
   const companyLogo = company?.logoUrl;
   const companyAddress = company?.address || 'Pan India Services';

   return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
         {/* Header */}
         <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     {companyLogo ? (
                        <img src={companyLogo} alt={companyName} className="h-12 w-12 object-contain rounded-lg" />
                     ) : (
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                           <Building2 className="w-6 h-6 text-white" />
                        </div>
                     )}
                     <div>
                        <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
                        <p className="text-xs text-gray-600">Your Trusted Service Partner</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <button
                        onClick={() => navigate('/login')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                     >
                        HR Portal <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>
         </header>

         {/* Hero Section */}
         <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center max-w-4xl mx-auto">
               <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium mb-4 animate-bounce">
                  🏆 Trusted by {activeSites}+ Sites Across India
               </div>
               <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Complete Service Solutions
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                     For Your Business
                  </span>
               </h1>
               <p className="text-xl text-gray-600 mb-8">
                  From manpower supply to facility management, we provide comprehensive services
                  to help your business run smoothly. Quality, reliability, and professionalism guaranteed.
               </p>
               <div className="flex flex-wrap justify-center gap-4">
                  <a href="#services">
                     <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2">
                        Our Services <ArrowRight className="w-5 h-5" />
                     </button>
                  </a>
                  <a href="#clients">
                     <button className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:border-blue-600 transition-all duration-200">
                        Our Clients
                     </button>
                  </a>
               </div>
            </div>
         </section>

         {/* Stats Section */}
         <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {stats.map((stat, idx) => (
                     <div key={idx} className="text-center">
                        <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                        <p className="text-blue-100">{stat.label}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Services Section */}
         <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Our Core Services
               </h2>
               <p className="text-xl text-gray-600">
                  We provide comprehensive business solutions across multiple domains
               </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {services.map((service, idx) => (
                  <div
                     key={idx}
                     className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group"
                  >
                     <div className={`bg-gradient-to-br ${service.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <service.icon className="w-8 h-8 text-white" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {service.title}
                     </h3>
                     <p className="text-gray-600">
                        {service.description}
                     </p>
                  </div>
               ))}
            </div>
         </section>

         {/* Client Sites Section */}
         {sites.length > 0 && (
            <section id="clients" className="bg-gray-50 py-20">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                     <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Our Presence
                     </h2>
                     <p className="text-xl text-gray-600">
                        Currently serving {activeSites} sites with {activeEmployees.length}+ dedicated professionals
                     </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {sites.slice(0, 6).map((site) => (
                        <div
                           key={site.id}
                           className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
                        >
                           <div className="flex items-start gap-4">
                              <div className="bg-blue-100 p-3 rounded-lg">
                                 <Building2 className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                 <h3 className="font-bold text-gray-900 mb-1">{site.name}</h3>
                                 <p className="text-sm text-gray-600 mb-2">{site.address}</p>
                                 <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Users className="w-4 h-4" />
                                    <span>{site.employeeCount} Workforce</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {sites.length > 6 && (
                     <div className="text-center mt-8">
                        <p className="text-gray-600">
                           + {sites.length - 6} more sites across India
                        </p>
                     </div>
                  )}
               </div>
            </section>
         )}

         {/* Why Choose Us */}
         <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
               <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">
                     Why Choose {companyName}?
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                     With over a decade of experience, we've built a reputation for excellence,
                     reliability, and customer satisfaction. Our team of professionals is committed
                     to delivering the highest quality services.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                     {features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                           <div className="bg-green-100 p-1 rounded-full mt-0.5">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                           </div>
                           <p className="text-gray-700 font-medium">{feature}</p>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white rounded-2xl shadow-2xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                     Key Highlights
                  </h3>

                  <div className="space-y-6">
                     <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                           <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                           <h4 className="font-semibold text-gray-900 mb-1">Enterprise Security</h4>
                           <p className="text-gray-600 text-sm">All personnel background verified with complete documentation</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-4">
                        <div className="bg-purple-100 p-2 rounded-lg">
                           <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                           <h4 className="font-semibold text-gray-900 mb-1">24/7 Support</h4>
                           <p className="text-gray-600 text-sm">Round-the-clock customer support for all your needs</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-4">
                        <div className="bg-green-100 p-2 rounded-lg">
                           <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                           <h4 className="font-semibold text-gray-900 mb-1">Trained Workforce</h4>
                           <p className="text-gray-600 text-sm">Currently managing {activeEmployees.length}+ skilled professionals</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-4">
                        <div className="bg-orange-100 p-2 rounded-lg">
                           <Star className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                           <h4 className="font-semibold text-gray-900 mb-1">Client Satisfaction</h4>
                           <p className="text-gray-600 text-sm">Serving {activeSites}+ prestigious clients across India</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Contact Section */}
         <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
               <h2 className="text-4xl font-bold mb-6">
                  Ready to Get Started?
               </h2>
               <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Contact us today to discuss your requirements and get a customized solution for your business
               </p>

               <div className="flex flex-wrap justify-center gap-6 mb-8">
                  <a href="tel:+919876543210" className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg hover:bg-white/30 transition-all">
                     <Phone className="w-5 h-5" />
                     <span>+91 98765 43210</span>
                  </a>
                  <a href="mailto:info@konarkservices.com" className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg hover:bg-white/30 transition-all">
                     <Mail className="w-5 h-5" />
                     <span>info@konarkservices.com</span>
                  </a>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                     <MapPin className="w-5 h-5" />
                     <span>{companyAddress}</span>
                  </div>
               </div>

               <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto">
                  Request a Quote <ArrowRight className="w-5 h-5" />
               </button>
            </div>
         </section>

         {/* Footer */}
         <footer className="bg-gray-900 text-gray-400 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid md:grid-cols-4 gap-8">
                  <div>
                     <div className="flex items-center gap-2 mb-4">
                        {companyLogo ? (
                           <img src={companyLogo} alt={companyName} className="h-8 w-8 object-contain" />
                        ) : (
                           <Building2 className="w-6 h-6 text-blue-400" />
                        )}
                        <span className="text-white font-bold">{companyName}</span>
                     </div>
                     <p className="text-sm">
                        Your trusted partner for comprehensive business solutions and workforce management.
                     </p>
                  </div>

                  <div>
                     <h4 className="text-white font-semibold mb-4">Services</h4>
                     <ul className="space-y-2 text-sm">
                        <li><a href="#services" className="hover:text-white transition-colors">Code Collection</a></li>
                        <li><a href="#services" className="hover:text-white transition-colors">Manpower Supply</a></li>
                        <li><a href="#services" className="hover:text-white transition-colors">Canteen Services</a></li>
                        <li><a href="#services" className="hover:text-white transition-colors">Hospital Diet</a></li>
                     </ul>
                  </div>

                  <div>
                     <h4 className="text-white font-semibold mb-4">Company</h4>
                     <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                        <li><a href="#clients" className="hover:text-white transition-colors">Our Clients</a></li>
                        <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                        <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">HR Portal</button></li>
                     </ul>
                  </div>

                  <div>
                     <h4 className="text-white font-semibold mb-4">Legal</h4>
                     <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                     </ul>
                  </div>
               </div>

               <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
                  <p>&copy; 2026 {companyName}. All rights reserved.</p>
               </div>
            </div>
         </footer>
      </div>
   );
}
