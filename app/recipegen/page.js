"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "../../config/firebase-config";
import { collection, getDocs } from "firebase/firestore";
import NavBar from "../../components/NavBar";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Slider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#00bfa6" },
    background: { default: "#f5f5f5", paper: "#ffffff" },
    text: { primary: "#121212", secondary: "#444444" },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
  },
  components: {
    MuiFormLabel: { styleOverrides: { root: { color: "#121212" } } },
    MuiInputLabel: { styleOverrides: { root: { color: "#121212" } } },
    MuiSlider: { styleOverrides: { markLabel: { color: "#121212" } } },
    MuiFormControlLabel: { styleOverrides: { label: { color: "#121212" } } },
    MuiTypography: { styleOverrides: { root: { color: "#121212" } } },
  },
});

export default function RecipeGeneratorPage() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    servingSize: '',
    dietary: [],
    calories: '',
    uniqueness: 3,
    cuisine: '',
    spice: 3,
    mustHaveIngredients: '',
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventoryCollection = collection(db, "inventory");
        const snapshot = await getDocs(inventoryCollection);
        const items = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if ((data.quantity || 0) > 0) {
            items.push(doc.id);
          }
        });
        setInventoryItems(items);
      } catch (error) {
        console.error("Failed to load inventory:", error);
      }
    };
    fetchInventory();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/suggestrecipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: inventoryItems,
          prompt: input,
          options
        }),
      });

      const data = await res.json();
      const botReply = {
        role: "assistant",
        content: formatRecipeText(data.recipe),
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error("Error fetching recipe:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Failed to get recipe." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatRecipeText = (recipe) => {
    if (!recipe) return "No recipe generated.";
    return `🍽️ ${recipe.name}\n\n🧂 Ingredients:\n${recipe.ingredients.join(
      "\n"
    )}\n\n👨‍🍳 Instructions:\n${recipe.steps
      .map((step, i) => `${i + 1}. ${step.replace(/^\d+\.\s*/, "")}`)
      .join("\n")}`;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOptionChange = (field, value) => {
    setOptions((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDietary = (value) => {
    setOptions((prev) => {
      const set = new Set(prev.dietary);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, dietary: Array.from(set) };
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavBar />
      <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
        <Box sx={{ flex: 3, display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", mb: 1.5 }}>
                <Box sx={{ maxWidth: "75%", bgcolor: msg.role === "user" ? "#e0f7f4" : "#ffffff", px: 2, py: 1.5, borderRadius: 2, boxShadow: 1, whiteSpace: "pre-wrap" }}>
                  <Typography variant="body2">{msg.content}</Typography>
                </Box>
              </Box>
            ))}
            {loading && <Typography color="text.secondary" sx={{ ml: 1 }}>Generating recipe...</Typography>}
            <div ref={chatEndRef} />
          </Box>
          <Box sx={{ borderTop: "1px solid #ddd", px: 2, py: 1, bgcolor: "background.paper", display: "flex", alignItems: "center" }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type ingredients or ask for a recipe..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              multiline
              maxRows={4}
              sx={{ mr: 1 }}
            />
            <IconButton onClick={handleSend} color="primary" disabled={loading || !input.trim()}>
              {loading ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, p: 3, borderLeft: "1px solid #ddd", bgcolor: "#f0fdfa", overflowY: "auto" }}>
          <Typography variant="h6" mb={2}>Optional Settings</Typography>
          <TextField label="Serving Size" type="number" fullWidth value={options.servingSize} onChange={(e) => handleOptionChange("servingSize", e.target.value)} sx={{ mb: 2 }} />
          <Typography gutterBottom>Dietary Restrictions</Typography>
          {["Kosher", "Halal", "Vegetarian", "Pescetarian", "Vegan", "Gluten-Free"].map((diet) => (
            <FormControlLabel key={diet} control={<Checkbox checked={options.dietary.includes(diet)} onChange={() => toggleDietary(diet)} />} label={diet} />
          ))}
          <TextField label="Calories per Serving" type="number" fullWidth value={options.calories} onChange={(e) => handleOptionChange("calories", e.target.value)} sx={{ mt: 2, mb: 2 }} />
          <TextField label="Cuisine Preference" fullWidth placeholder="e.g., Italian, Thai, Fusion..." value={options.cuisine} onChange={(e) => handleOptionChange("cuisine", e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Must-Have Ingredients" placeholder="Separate with commas or type freely" multiline rows={2} fullWidth value={options.mustHaveIngredients} onChange={(e) => handleOptionChange("mustHaveIngredients", e.target.value)} sx={{ mb: 2 }} />
          <Typography gutterBottom>Uniqueness Level</Typography>
          <Slider value={options.uniqueness} onChange={(_, value) => handleOptionChange("uniqueness", value)} step={1} marks min={1} max={5} valueLabelDisplay="auto" sx={{ color: "primary.main", mb: 2 }} />
          <Typography gutterBottom>Sweetness / Spice</Typography>
          <Slider value={options.spice} onChange={(_, value) => handleOptionChange("spice", value)} step={1} marks min={1} max={5} valueLabelDisplay="auto" sx={{ color: "primary.main" }} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
