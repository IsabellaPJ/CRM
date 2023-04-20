const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { LinearRegression } = require('ml-regression');

const app = express();

// Connect to the MongoDB database
mongoose.connect('mongodb://localhost:27017/mydb', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define the schema for the invoice data
const invoiceSchema = new mongoose.Schema({
  customer_id: String,
  date: Date,
  amount: Number
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

// Define the schema for the sales data
const salesSchema = new mongoose.Schema({
  customer_id: String,
  date: Date,
  amount: Number
});

const Sales = mongoose.model('Sales', salesSchema);

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint to retrieve customer growth data
app.get('/api/customer-growth', async (req, res) => {
  try {
    // Retrieve the invoice and sales data for each customer
    const customers = await Invoice.distinct('customer_id');
    const data = customers.map(async (customer_id) => {
      const invoices = await Invoice.find({ customer_id });
      const sales = await Sales.find({ customer_id });
      return { customer_id, invoices, sales };
    });

    // Calculate the correlation between invoices and sales for each customer
    const customerData = await Promise.all(data);
    const correlationData = customerData.map((customer) => {
      const invoiceAmounts = customer.invoices.map((invoice) => invoice.amount);
      const salesAmounts = customer.sales.map((sale) => sale.amount);
      const correlation = calculateCorrelation(invoiceAmounts, salesAmounts);
      return { customer_id: customer.customer_id, correlation };
    });

    // Build a machine learning model to predict customer growth
    const modelData = correlationData.filter((data) => !isNaN(data.correlation));
    const model = new LinearRegression(modelData.map((data) => [data.correlation]), modelData.map((data) => data.sales.length));

    // Make predictions for each customer
    const predictions = correlationData.map((data) => {
      const correlation = isNaN(data.correlation) ? 0 : data.correlation;
      const growth = model.predict([correlation])[0];
      return { customer_id: data.customer_id, growth };
    });

    res.json(predictions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Function to calculate the correlation between two arrays of numbers
function calculateCorrelation(x, y) {
  const n = x.length;
  const xMean = mean(x);
  const yMean = mean(y);
  const xStdDev = stdDev(x, xMean);
  const yStdDev = stdDev(y, yMean);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (x[i] - xMean) * (y[i] - yMean);
  }
  return sum / ((n - 1) * xStdDev * yStdDev);
}

// Function to calculate the mean of an array of numbers
function mean(arr) {
  return arr.reduce((a, b) => a +
