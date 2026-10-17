const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve your frontend HTML file
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB Cloud Database
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://dorabaddireddy78_db_user:qps9NA9kh3gb0cmw@cluster0.nafuvah.mongodb.net/dorabank?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas Cloud Database"))
    .catch(err => console.error("Database connection error:", err));

// Database Schema
const accountSchema = new mongoose.Schema({
    accountNumber: { type: String, unique: true },
    name: String,
    phone: String,
    email: String,
    balance: Number,
    status: String,
    history: Array
});

const Account = mongoose.model('Account', accountSchema);

// API: Register / Onboard a New Account
app.post('/api/register', async (req, res) => {
    try {
        const { accountNumber, name, phone, email, type, pan, address, nominee } = req.body;
        
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const ackCode = `ACK-${Math.floor(100 + Math.random() * 900)}`;

        const newAccount = new Account({
            accountNumber,
            name,
            phone,
            email,
            balance: 0,
            status: "Active",
            history: [{
                timestamp,
                ack: ackCode,
                op: "INITIAL SYSTEM ACCOUNT RECORD GENERATION",
                flow: "₹ 0",
                post: "₹ 0",
                st: "VERIFIED"
            }]
        });

        await newAccount.save();
        res.json({ success: true, accountNumber, ack: ackCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Search an account by account number
app.get('/api/accounts/:accNum', async (req, res) => {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accNum });
        if (!account) return res.status(404).json({ error: "Account not found" });
        res.json(account);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Perform Transaction (Withdraw / Deposit)
app.post('/api/transaction', async (req, res) => {
    try {
        const { accountNumber, amount, type } = req.body;
        const account = await Account.findOne({ accountNumber });
        if (!account) return res.status(404).json({ error: "Account not found" });

        if (type === 'Withdraw' && account.balance < amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        if (type === 'Withdraw') {
            account.balance -= amount;
        } else {
            account.balance += amount;
        }

        const ackCode = `ACK-${Math.floor(100 + Math.random() * 900)}`;
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

        account.history.push({
            timestamp,
            ack: ackCode,
            op: `COUNTER ${type.toUpperCase()}`,
            flow: `${type === 'Withdraw' ? '-' : '+'}₹ ${amount.toLocaleString('en-IN')}`,
            post: `₹ ${account.balance.toLocaleString('en-IN')}`,
            st: "VERIFIED"
        });

        await account.save();
        res.json({ success: true, balance: account.balance, ack: ackCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Update KYC
app.post('/api/kyc', async (req, res) => {
    try {
        const { accountNumber, name, phone, email, aadhar } = req.body;
        const account = await Account.findOne({ accountNumber });
        if (!account) return res.status(404).json({ error: "Account not found" });

        account.name = name;
        account.phone = phone;
        account.email = email;

        const ackCode = `ACK-KYC-${Math.floor(100 + Math.random() * 900)}`;
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

        account.history.push({
            timestamp,
            ack: ackCode,
            op: "BASIC KYC OPTIMIZATION RECORDED",
            flow: "₹ 0",
            post: `₹ ${account.balance.toLocaleString('en-IN')}`,
            st: "VERIFIED"
        });

        await account.save();
        res.json({ success: true, ack: ackCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));