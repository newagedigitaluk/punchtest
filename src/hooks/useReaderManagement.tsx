
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useReaderManagement = (isTestMode: boolean) => {
  const [availableReaders, setAvailableReaders] = useState<any[]>([]);
  const [selectedReaderId, setSelectedReaderId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // Fetch available readers on component mount
  useEffect(() => {
    const fetchReaders = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('sumup-readers', {
          body: { isTestMode, action: 'list' }
        });

        if (error) throw error;

        if (data.success && data.readers && data.readers.length > 0) {
          setAvailableReaders(data.readers);
          // Auto-select the first reader
          setSelectedReaderId(data.readers[0].id);
          console.log('Available readers:', data.readers);
        } else {
          setError('No SumUp readers found. Please pair a reader first.');
        }
      } catch (err) {
        console.error('Failed to fetch readers:', err);
        setError('Failed to fetch readers. Please check SumUp settings.');
      }
    };

    fetchReaders();
  }, [isTestMode]);

  return {
    availableReaders,
    selectedReaderId,
    error,
    setError
  };
};
