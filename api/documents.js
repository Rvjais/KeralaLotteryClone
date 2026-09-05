const connectToDatabase = require('../lib/mongodb');
const Setting = require('../models/Setting');

const DEFAULT_DOCUMENTS = {
  approval: {
    to_name: 'Kerala lottery',
    ticket_no: 'KL754913',
    aadhar: '394333555107',
    lottery_amount: '12,00,000',
    reg_fee: '₹5,999',
    customer_name: 'Pradeep kumar',
    account_no: '55154897618',
    ifsc: 'SBIN000872',
    letter_date: '05/09/2026',
    pay_name: 'Kerala Government lottery',
    pay_account: 'XXXXXXXX1088',
    pay_ifsc: 'ICICXXX3033',
    legal_text: 'Registration Fees refundable balance INR 5,000/- Only'
  },
  gst: {
    bill_to: 'Gk',
    total_amount: '1217000',
    gst_rate: '1.55%',
    gst_amount: '19880',
    final_amount: '1217000',
    sgst_rate: '1.55%',
    sgst_amount: '19880',
    cgst_rate: '1.55%',
    cgst_amount: '19880',
    sub_total: '1236000',
    amount_words: '19500 Pay Only'
  },
  noc: {
    customer_name: 'Mrityunjoy Mondal',
    total_amount: '1256000',
    noc_charges: '25999',
    sub_total: '1281000'
  },
  rbi: {
    customer_name: 'N MAHALAKSHMI',
    winning_amount: '1224000',
    verification_amount: '9999',
    account_number: '186101000005386',
    final_amount: '1234000'
  },
  tds: {
    bill_to: 'Vinod Sukhbabu Ambar',
    total_amount: '1205000',
    tds_rate: '1.2%',
    tds_amount: '12999',
    net_amount: '1217000'
  },
  all_tax: {
    level: '5th',
    debit_account: 'XXXXXXX2286',
    debit_branch: 'Kerala Thiruvananthapuram',
    reason_of_hold: 'NEFT/RTGS',
    beneficiary_name: 'R.Mariyammal',
    credit_account: '500101012119254',
    transaction_date: '05/09/2026',
    amount: '12,06,000/-',
    message: 'Dear Customer. INR 12,0,6000/- Credited in your A/C  XXXXXX9254 ON 05/09/2026 Your amount is hold reason for  {NEFT/RTGS} please pay  16780/-  only.This charge is refundable.If any problem Contact No Thanks ADCFIN',
    status: 'Processing'
  }
};

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await connectToDatabase();
    const docType = (req.query && req.query.type) ? req.query.type.toLowerCase().trim() : null;

    if (req.method === 'GET') {
      if (docType) {
        if (!DEFAULT_DOCUMENTS[docType]) {
          return res.status(400).json({ success: false, message: `Invalid document type: ${docType}` });
        }
        if (db) {
          const doc = await Setting.findOne({ key: `doc_${docType}` });
          if (doc && doc.value) {
            return res.status(200).json({ success: true, type: docType, data: doc.value });
          }
        }
        return res.status(200).json({ success: true, type: docType, data: DEFAULT_DOCUMENTS[docType] });
      }

      // Return all document settings
      const allDocs = Object.assign({}, DEFAULT_DOCUMENTS);
      if (db) {
        for (const type of Object.keys(DEFAULT_DOCUMENTS)) {
          const doc = await Setting.findOne({ key: `doc_${type}` });
          if (doc && doc.value) {
            allDocs[type] = doc.value;
          }
        }
      }
      return res.status(200).json({ success: true, data: allDocs });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { type, data, bulk, allDocs } = req.body || {};

      // Handle Bulk All-Documents Generation
      if (bulk && allDocs && typeof allDocs === 'object') {
        const savedDocs = {};
        for (const [docKey, docVal] of Object.entries(allDocs)) {
          if (DEFAULT_DOCUMENTS[docKey]) {
            const merged = Object.assign({}, DEFAULT_DOCUMENTS[docKey], docVal);
            if (db) {
              await Setting.findOneAndUpdate(
                { key: `doc_${docKey}` },
                { key: `doc_${docKey}`, value: merged, updatedAt: new Date() },
                { upsert: true, new: true }
              );
            }
            savedDocs[docKey] = merged;
          }
        }
        return res.status(200).json({
          success: true,
          message: 'All 6 official document templates successfully generated and synced to MongoDB Atlas!',
          data: savedDocs
        });
      }

      const targetType = (type || docType || '').toLowerCase().trim();

      if (!targetType || !DEFAULT_DOCUMENTS[targetType]) {
        return res.status(400).json({ success: false, message: 'Invalid or missing document type.' });
      }

      if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid document payload.' });
      }

      const mergedData = Object.assign({}, DEFAULT_DOCUMENTS[targetType], data);

      if (db) {
        await Setting.findOneAndUpdate(
          { key: `doc_${targetType}` },
          { key: `doc_${targetType}`, value: mergedData, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      }

      return res.status(200).json({
        success: true,
        message: `${targetType.toUpperCase()} document template saved successfully to MongoDB Atlas.`,
        type: targetType,
        data: mergedData
      });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error) {
    console.error('[Documents API Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Database error' });
  }
};

