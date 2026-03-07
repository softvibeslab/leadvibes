import React from 'react';
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Funcionalidades', href: '#features' },
      { label: 'Beneficios', href: '#benefits' },
      { label: 'Casos de Uso', href: '#use-cases' },
      { label: 'Precios', href: '#pricing' },
    ],
    company: [
      { label: 'Nosotros', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Carreras', href: '#' },
      { label: 'Prensa', href: '#' },
    ],
    support: [
      { label: 'Centro de Ayuda', href: '#' },
      { label: 'Documentación', href: '#' },
      { label: 'Estado del Sistema', href: '#' },
      { label: 'Contacto', href: 'mailto:hola@rovicrm.com' },
    ],
    legal: [
      { label: 'Términos de Servicio', href: '#' },
      { label: 'Política de Privacidad', href: '#' },
      { label: 'Cookies', href: '#' },
      { label: 'Seguridad', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-2xl font-bold">Rovi CRM</span>
            </div>
            <p className="text-slate-400 mb-6 max-w-sm">
              El CRM diseñado específicamente para el mercado inmobiliario de alto valor
              en México y Latinoamérica.
            </p>

            <div className="space-y-3">
              <a href="mailto:hola@rovicrm.com" className="flex items-center text-slate-400 hover:text-white transition">
                <Mail className="w-5 h-5 mr-3" />
                hola@rovicrm.com
              </a>
              <a href="tel:+529984123456" className="flex items-center text-slate-400 hover:text-white transition">
                <Phone className="w-5 h-5 mr-3" />
                +52 998 412 3456
              </a>
              <div className="flex items-center text-slate-400">
                <MapPin className="w-5 h-5 mr-3" />
                Tulum, Quintana Roo, México
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary flex items-center justify-center transition"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Soporte</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trusted By */}
        <div className="mt-16 pt-16 border-t border-slate-800">
          <p className="text-center text-slate-400 text-sm mb-6">
            Certificado por:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['ISO 27001', 'SOC 2', 'GDPR Compliant', 'Amazon Partners'].map((cert) => (
              <span key={cert} className="text-slate-400 font-semibold">
                {cert}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">
              © {currentYear} Rovi CRM. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-slate-400 text-sm">Hecho con ❤️ en México</span>
              <Link to="/login" className="text-primary hover:text-primary/80 text-sm font-semibold">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
