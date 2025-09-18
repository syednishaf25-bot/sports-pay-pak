import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.footer
      className="bg-card border-t mt-auto"
      variants={footerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xl font-bold text-primary">T-Sports</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your trusted partner for premium sports equipment and accessories. 
              Serving athletes and sports enthusiasts across Pakistan with quality products.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Home
              </Link>
              <Link to="/products" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                All Products
              </Link>
              <Link to="/category/football" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Football
              </Link>
              <Link to="/category/cricket" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Cricket
              </Link>
              <Link to="/category/basketball" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Basketball
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Contact Us
              </Link>
            </nav>
          </motion.div>

          {/* Customer Service */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="font-semibold text-foreground">Customer Service</h4>
            <nav className="flex flex-col space-y-2">
              <Link to="/my-account" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                My Account
              </Link>
              <Link to="/my-account?tab=orders" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Order History
              </Link>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Return Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Shipping Info
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Size Guide
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                FAQ
              </a>
            </nav>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>Satellite Town, Khanpur</p>
                  <p>Near Al Madina Stationary</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="tel:03367870538" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  03367870538
                </a>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:info@tsports.pk" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  info@tsports.pk
                </a>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>Mon-Sat: 9AM-9PM</p>
                  <p>Sunday: 10AM-6PM</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          variants={itemVariants}
          className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
        >
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <p>&copy; {currentYear} T-Sports (Tahir Sports). All rights reserved.</p>
            <p className="mt-1">Owned by <span className="font-semibold text-primary">Tahir Yaqoob</span></p>
          </div>
          
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Refund Policy
            </a>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;