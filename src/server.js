const { app, connectWithRetry } = require('./app');

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Connect to MongoDB
connectWithRetry(process.env.MONGODB_URI);
