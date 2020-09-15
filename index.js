const express = require("express");
const axios = require("axios");
const register = require("./register");
const app = express();

// Middlewares
app.use(
  express.json({
    limit: "10kb",
  })
);

app.use(express.static("public"));

// Extract the data from envirnment variables
const data = { ...process.env };

// Define Routes
// Home page
app.get("/", (req, res) => {
  res.sendFile(`/index.html`);
});

app.get("/stop", (req, res) => {
  for (let i = 0; i < 9999999; i++) {
    clearInterval(i);
  }
  res.status(200).json({
    status: "success",
    message: "process stoped",
  });
});

// Register the domain
app.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const data = await register({ ...req.body });

    if (data.payment_succeed) {
      return res.status(200).json({
        status: "success",
        message: `${req.body.domain} Domain registered successfully`,
      });
    } else {
      return res.status(200).json({
        status: "fail",
        message:
          "error registering domain please make sure you provide correct data",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(200).json({
      status: "fail",
      message: "error registering your domain",
    });
  }
});

// Check the Domain
app.post("/check", async (req, res) => {
  try {
    const domain = req.body.domain;

    console.log(req.body);

    if (!req.body.domain) {
      throw new Error("Pleas provide a domain name");
      return;
    }

    const url = `https://api.sidn.nl/rest/whois?domain=${domain}`;

    const response = await axios.get(url);

    const data = response.data;

    const isActive = data.details.state.type;

    if (isActive === "ACTIVE") {
      res.status(200).json({
        status: "success",
        is_active: true,
        message: `${domain} is active`,
        domain: domain,
      });
    } else if (isActive === "FREE") {
      res.status(200).json({
        status: "success",
        is_active: false,
        message: `${domain} is free`,
        domain,
      });
    } else if (isActive === "QUARANTINE") {
      res.status(200).json({
        status: "success",
        is_active: true,
        message: `${domain} is in QUARANTINE`,
        domain,
      });
    }
  } catch (err) {
    res.status(200).json({
      status: "fail",
      message: err.message,
    });
  }
});

// Create the server
app.listen(process.env.PORT || 8000, () =>
  console.log("Server has started...")
);
