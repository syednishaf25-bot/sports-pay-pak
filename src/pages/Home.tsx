import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Trophy, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import heroImage from '@/assets/hero-sports.jpg';

// Mock data - in real app, this would come from Supabase
const featuredProducts = [
  {
    id: '1',
    name: 'Professional Football - FIFA Quality',
    price: 3500,
    originalPrice: 4200,
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500',
    category: 'Football',
    rating: 5,
    reviews: 127,
    inStock: true,
  },
  {
    id: '2',
    name: 'Premium Cricket Bat - English Willow',
    price: 8500,
    originalPrice: 10000,
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
    category: 'Cricket',
    rating: 4,
    reviews: 89,
    inStock: true,
  },
  {
    id: '3',
    name: 'Professional Basketball - Indoor/Outdoor',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
    category: 'Basketball',
    rating: 4,
    reviews: 156,
    inStock: true,
  },
  {
    id: '4',
    name: 'Tennis Racket - Carbon Fiber Pro',
    price: 12000,
    originalPrice: 15000,
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500',
    category: 'Tennis',
    rating: 5,
    reviews: 203,
    inStock: false,
  },
  {
    id: '5',
    name: 'Football Boots - Professional Grade',
    price: 6800,
    image: 'https://images.unsplash.com/photo-1628253747716-0c4f5c90fdda?w=500',
    category: 'Football',
    rating: 4,
    reviews: 92,
    inStock: true,
  },
  {
    id: '6',
    name: 'Cricket Protective Gear Set',
    price: 4500,
    originalPrice: 5500,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
    category: 'Cricket',
    rating: 4,
    reviews: 74,
    inStock: true,
  },
];

const categories = [
  {
    name: 'Football',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=300',
    count: 245,
  },
  {
    name: 'Cricket',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=300',
    count: 189,
  },
  {
    name: 'Basketball',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300',
    count: 167,
  },
  {
    name: 'Tennis',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300',
    count: 134,
  },
];

const features = [
  {
    icon: Trophy,
    title: 'Premium Quality',
    description: 'Professional-grade sports equipment from top brands',
  },
  {
    icon: Shield,
    title: 'Authentic Products',
    description: '100% genuine products with warranty',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Free shipping across Pakistan on orders over PKR 2000',
  },
  {
    icon: Star,
    title: 'Expert Support',
    description: '24/7 customer support by sports enthusiasts',
  },
];

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section 
        className="relative h-[80vh] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-secondary/70" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <Badge className="mb-4 bg-primary text-primary-foreground">
            Pakistan's Premier Sports Store
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Gear Up for
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Victory</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Professional sports equipment for champions. From cricket bats to footballs, 
            we have everything you need to dominate your game.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:bg-primary/90">
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              View Categories
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground text-lg">
              Find the perfect equipment for your favorite sport
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link key={index} to={`/category/${category.name.toLowerCase()}`}>
                <Card className="group cursor-pointer overflow-hidden hover:shadow-glow transition-all duration-300">
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} products</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground text-lg">
              Hand-picked products by our sports experts
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button size="lg" variant="outline">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="h-12 w-12 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Play Like a Pro?</h2>
          <p className="text-lg mb-8 text-white/90">
            Join thousands of satisfied customers who trust Tahir Sports
          </p>
          <Button size="lg" className="bg-white text-secondary hover:bg-white/90">
            Start Shopping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;