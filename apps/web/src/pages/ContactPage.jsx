
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Send, Loader2, CheckCircle, Twitter, Github, MessageSquare } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields correctly",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiServerClient.fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible"
      });

      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - Bloxology</title>
        <meta name="description" content="Get in touch with the Bloxology team" />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-2"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
              Contact Us
            </h1>
            <p className="text-lg text-[var(--text-secondary)] font-medium">
              Have questions? We'd love to hear from you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Mail className="h-5 w-5 text-primary" />
                    Send us a message
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)] font-medium">
                    Fill out the form below and we'll get back to you shortly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`input-high-contrast ${errors.name ? 'border-destructive' : ''}`}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive font-medium">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          className={`input-high-contrast ${errors.email ? 'border-destructive' : ''}`}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive font-medium">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="What is this about?"
                        value={formData.subject}
                        onChange={handleChange}
                        className={`input-high-contrast ${errors.subject ? 'border-destructive' : ''}`}
                      />
                      {errors.subject && (
                        <p className="text-sm text-destructive font-medium">{errors.subject}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more..."
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className={`input-high-contrast resize-none ${errors.message ? 'border-destructive' : ''}`}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive font-medium">{errors.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 crypto-gradient text-white font-bold hover:opacity-90 transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-[var(--text-primary)]">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">Email</p>
                      <a href="mailto:support@bloxology.io" className="text-sm text-[var(--text-secondary)] font-medium hover:text-primary transition-colors">
                        support@bloxology.io
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-[var(--text-primary)]">Connect With Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="https://twitter.com/bloxology"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 glass-card rounded-lg hover:glass-card-strong transition-all duration-200 group text-[var(--text-primary)] font-medium"
                  >
                    <Twitter className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-primary transition-colors" />
                    <span>Twitter</span>
                  </a>
                  <a
                    href="https://github.com/bloxology"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 glass-card rounded-lg hover:glass-card-strong transition-all duration-200 group text-[var(--text-primary)] font-medium"
                  >
                    <Github className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-primary transition-colors" />
                    <span>GitHub</span>
                  </a>
                  <a
                    href="https://discord.gg/bloxology"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 glass-card rounded-lg hover:glass-card-strong transition-all duration-200 group text-[var(--text-primary)] font-medium"
                  >
                    <MessageSquare className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-primary transition-colors" />
                    <span>Discord</span>
                  </a>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center gap-2 text-accent">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-bold">Quick Response</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] font-medium">
                    We typically respond within 24 hours during business days
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
