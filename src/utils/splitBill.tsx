import axios from 'axios';

export interface SplitBillInput {
  lnAddress: string;
  amount: number;
  numPeople: number;
}

export interface SplitBillResult {
  invoices: string[];
  shareSats: number;
  error?: string;
}

export async function splitBill({ 
  lnAddress, 
  amount, 
  numPeople 
}: SplitBillInput): Promise<SplitBillResult> {
  // Input validation
  if (!lnAddress || amount <= 0 || numPeople <= 0) {
    return { 
      invoices: [], 
      shareSats: 0, 
      error: "Invalid input: LN address, positive amount, and positive num_people required." 
    };
  }
  
  // Calculate share amount (ceiling division)
  const shareSats = Math.ceil(amount / numPeople);
  const shareMsats = shareSats * 1000;
  
  // Parse Lightning Address
  const addressParts = lnAddress.split('@');
  if (addressParts.length !== 2) {
    return { 
      invoices: [], 
      shareSats: 0, 
      error: "Invalid LN address format. Use: user@domain.com." 
    };
  }
  
  const [username, domain] = addressParts;
  const wellKnownUrl = `https://${domain}/.well-known/lnurlp/${username}`;
  
  try {
    // Step 1: Fetch LNURL metadata
    const metadataResponse = await axios.get(wellKnownUrl, { timeout: 10000 });
    const lnurlData = metadataResponse.data;
    
    // Verify it's a pay request
    if (lnurlData.tag !== 'payRequest') {
      return { 
        invoices: [], 
        shareSats, 
        error: "The provided address does not support LNURL-pay." 
      };
    }
    
    // Check amount limits
    if (shareMsats < lnurlData.minSendable || shareMsats > lnurlData.maxSendable) {
      const min = lnurlData.minSendable / 1000;
      const max = lnurlData.maxSendable / 1000;
      return { 
        invoices: [], 
        shareSats, 
        error: `Share amount ${shareSats} sats is outside the allowed range (min ${min} sats, max ${max} sats).` 
      };
    }
    
    // Step 2: Generate invoices for each person
    const invoices: string[] = [];
    const callbackUrl = lnurlData.callback;
    
    for (let i = 0; i < numPeople; i++) {
      try {
        const payLink = `${callbackUrl}?amount=${shareMsats}`;
        const invoiceResponse = await axios.get(payLink, { timeout: 10000 });
        
        if (invoiceResponse.status !== 200) {
          invoices.push(`Error: API responded with status ${invoiceResponse.status}`);
          continue;
        }
        
        const invoice = invoiceResponse.data.pr; // 'pr' contains the BOLT11 invoice
        if (!invoice) {
          invoices.push(`Error: No invoice found in response`);
          continue;
        }
        
        invoices.push(invoice);
      } catch (error: any) {
        invoices.push(`Error: Failed to generate invoice - ${error.message}`);
      }
    }
    
    // Check if any invoices were successfully generated
    const successfulInvoices = invoices.filter(inv => !inv.startsWith("Error"));
    if (successfulInvoices.length === 0) {
      return { 
        invoices, 
        shareSats, 
        error: "Unable to generate any invoices. Check the errors below." 
      };
    }
    
    return { invoices, shareSats };
    
  } catch (error: any) {
    return { 
      invoices: [], 
      shareSats, 
      error: `Failed to resolve Lightning Address: ${error.message}` 
    };
  }
}