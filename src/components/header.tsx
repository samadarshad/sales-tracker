import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Input,
} from "@nextui-org/react";
import HeaderAuth from "@/components/header-auth";

export default function Header() {
  return (
    <Navbar>
      <NavbarBrand>
        <Link href="/" className="font-bold">
          Sales Tracker
        </Link>
      </NavbarBrand>
      <NavbarContent justify="center">
        <NavbarItem>
          <Input name="search" label="Search" />
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <HeaderAuth />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
