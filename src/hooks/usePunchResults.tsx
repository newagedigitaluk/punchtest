
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
        console.log('Received punch results:', payload);
        
        const { punchForce, clientTransactionId, status } = payload.payload;
        
        console.log(`Punch completed: ${punchForce}kg for transaction ${clientTransactionId}`);

        if (status === 'completed') {
          setPunchStatus('completed');
          onPunchComplete(punchForce);
        }
      })
      .subscribe((status) => {
        console.log(`Punch results subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${channelName}`);
        }
      });

    // Set a timeout for punch completion (30 seconds)
    const punchTimeout = setTimeout(() => {
      console.log('Punch timeout reached - no punch detected');
      setPunchStatus('timeout');
    }, 30000);

    return () => {
      console.log(`Unsubscribing from ${channelName}`);
      channel.unsubscribe();
      clearTimeout(punchTimeout);
    };
  }, [checkoutId, punchStatus, onPunchComplete]);

  const startWaitingForPunch = () => {
    setIsWaitingForPunch(true);
    setPunchStatus('waiting');
  };

  const resetPunchState = () => {
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
