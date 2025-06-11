
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UsePunchResultsProps {
  checkoutId: string | null;
  onPunchComplete: (force: number) => void;
}

export const usePunchResults = ({ 
  checkoutId, 
  onPunchComplete 
}: UsePunchResultsProps) => {
  const [isWaitingForPunch, setIsWaitingForPunch] = useState(false);
  const [punchStatus, setPunchStatus] = useState<'idle' | 'waiting' | 'completed' | 'timeout'>('idle');

  // Listen for punch results from Raspberry Pi
  useEffect(() => {
    if (!checkoutId || punchStatus !== 'waiting') {
      return;
    }

    console.log(`Setting up punch results listener for transaction: ${checkoutId}`);
    
    const channelName = `punch-results-${checkoutId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'punch_completed' }, (payload) => {
        console.log('Received punch results broadcast:', payload);
        
        const { punchForce, clientTransactionId, status } = payload.payload;
        
        console.log(`Punch completed: ${punchForce}kg for transaction ${clientTransactionId}, status: ${status}`);

        if (status === 'completed' && punchForce !== undefined) {
          console.log('Processing punch completion...');
          setPunchStatus('completed');
          setIsWaitingForPunch(false);
          
          // Ensure we call the callback with the force value
          setTimeout(() => {
            console.log(`Calling onPunchComplete with force: ${punchForce}`);
            onPunchComplete(punchForce);
          }, 100);
        }
      })
      .subscribe((status) => {
        console.log(`Punch results subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to ${channelName}`);
        }
      });

    // Set a timeout for punch completion (45 seconds - longer than the 30s Pi timeout)
    const punchTimeout = setTimeout(() => {
      console.log('Punch timeout reached - no punch detected within 45 seconds');
      setPunchStatus('timeout');
      setIsWaitingForPunch(false);
    }, 45000);

    return () => {
      console.log(`Cleaning up: Unsubscribing from ${channelName}`);
      channel.unsubscribe();
      clearTimeout(punchTimeout);
    };
  }, [checkoutId, punchStatus, onPunchComplete]);

  const startWaitingForPunch = () => {
    console.log('Starting to wait for punch results...');
    setIsWaitingForPunch(true);
    setPunchStatus('waiting');
  };

  const resetPunchState = () => {
    console.log('Resetting punch state');
    setIsWaitingForPunch(false);
    setPunchStatus('idle');
  };

  return {
    isWaitingForPunch,
    punchStatus,
    startWaitingForPunch,
    resetPunchState
  };
};
