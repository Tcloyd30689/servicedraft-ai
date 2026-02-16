'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';

interface SupportFormProps {
  onClose: () => void;
}

export default function SupportForm({ onClose }: SupportFormProps) {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.username || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error('Failed to send');

      toast.success('Support ticket submitted!');
      onClose();
    } catch {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <Input
        id="support-name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        required
      />
      <Input
        id="support-email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <Textarea
        id="support-message"
        label="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your issue or question..."
        required
      />
      <Button type="submit" size="fullWidth" disabled={loading}>
        {loading ? 'SENDING...' : 'SUBMIT TICKET'}
      </Button>
    </form>
  );
}
