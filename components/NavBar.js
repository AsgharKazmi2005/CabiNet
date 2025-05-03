"use client";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Link from "next/link";

const NavBar = () => {
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#00bfa6", // Green-blue background
        color: "#ffffff",            // White text
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            CabiNet
          </Link>
        </Typography>

        <Box>
          <Link href="/" passHref>
            <Button sx={{ color: "#ffffff" }}>Dashboard</Button>
          </Link>
          <Link href="/recipegen" passHref>
            <Button sx={{ color: "#ffffff" }}>Recipe Generator</Button>
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
