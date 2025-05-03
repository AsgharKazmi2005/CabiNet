import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';


export default function TopBar({ toggleDrawer }) {
  return (
<Link href="/recipe-generator">
  <Button color="inherit">Recipe Chat</Button>
</Link>
  );
}