require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN;

app.post('/save-search', async (req, res) => {
    const { customerId, searchUrl } = req.body;

    if (!customerId || !searchUrl) {
        return res.status(400).json({ success: false, message: "Missing customerId or searchUrl" });
    }

    try {
        // Get existing metafields
        let response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/customers/${customerId}/metafields.json`, {
            method: "GET",
            headers: {
                "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
                "Content-Type": "application/json"
            }
        });

        let data = await response.json();
        let savedSearches = [];

        // Check if the metafield exists
        let metafield = data.metafields?.find(mf => mf.namespace === "saved_searches" && mf.key === "search_urls");
        if (metafield && metafield.value) {
            savedSearches = JSON.parse(metafield.value);
        }

        if (!savedSearches.includes(searchUrl)) {
            savedSearches.push(searchUrl);
        }

        // Update or Create Metafield
        let method = metafield ? "PUT" : "POST";
        let metafieldPayload = {
            namespace: "saved_searches",
            key: "search_urls",
            value: JSON.stringify(savedSearches),
            type: "json"
        };

        if (metafield) {
            metafieldPayload.id = metafield.id;
        }

        await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/customers/${customerId}/metafields.json`, {
            method,
            headers: {
                "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ metafield: metafieldPayload })
        });

        res.json({ success: true, message: "Search saved successfully!" });
    } catch (error) {
        console.error("Error saving search:", error);
        res.status(500).json({ success: false, message: "Error saving search" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
