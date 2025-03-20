require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend requests

const SHOPIFY_STORE = "quickstart-4720c706.myshopify.com";
const ADMIN_API_ACCESS_TOKEN = "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";

app.post('/save-search', async (req, res) => {
    const { customerId, searchUrl } = req.body;

    try {
        // Get existing customer metafields
        let response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/customers/${customerId}/metafields.json`, {
            method: "GET",
            headers: {
                "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
                "Content-Type": "application/json"
            }
        });

        let data = await response.json();
        let savedSearches = [];

        // Check if there's already a saved search metafield
        let metafield = data.metafields?.find(mf => mf.namespace === "saved_searches" && mf.key === "search_urls");
        if (metafield) {
            savedSearches = JSON.parse(metafield.value);
        }

        if (!savedSearches.includes(searchUrl)) {
            savedSearches.push(searchUrl);
        }

        // Save updated metafield
        await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/customers/${customerId}/metafields.json`, {
            method: metafield ? "PUT" : "POST",
            headers: {
                "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                metafield: {
                    id: metafield?.id, // If it exists, update it
                    namespace: "saved_searches",
                    key: "search_urls",
                    value: JSON.stringify(savedSearches),
                    type: "json"
                }
            })
        });

        res.json({ success: true, message: "Search saved successfully!" });
    } catch (error) {
        console.error("Error saving search:", error);
        res.status(500).json({ success: false, message: "Error saving search" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
