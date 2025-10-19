import { useNavigate, NavLink } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import api from "../api/axios";
import logo from "../assets/r_y.jpg";

export default function BarreNavigation() {
  const navigate = useNavigate();

  const utilisateur = JSON.parse(localStorage.getItem("user"));
  const role = utilisateur?.role; // "root" ou "admin"

  const deconnexion = async () => {
    const token = localStorage.getItem("token");
    try {
      if (token) {
        await api.post(
          "/auth/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/", { replace: true });
    }
  };

  // Liens dynamiques selon le rôle
 const liens = [
  ...(role === "root"
    ? [
        { nom: "Tableau de bord", chemin: "/dashboard" },
        { nom: "Tableau Excel", chemin: "/remises" }, // only root
      ]
    : [{ nom: "Panneau Admin", chemin: "/admin-panel" }]),
  { nom: "Fournisseurs", chemin: "/fournisseur" },
  { nom: "Produits", chemin: "/produits" },
  { nom: "Laboratoire", chemin: "/laboratoire" },
];

  function classes(...valeurs) {
    return valeurs.filter(Boolean).join(" ");
  }

  return (
    <Disclosure
      as="nav"
      className="relative bg-gray-900 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Bouton menu mobile */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white">
              <Bars3Icon className="block size-6 group-data-open:hidden" aria-hidden="true" />
              <XMarkIcon className="hidden size-6 group-data-open:block" aria-hidden="true" />
            </DisclosureButton>
          </div>

          {/* Logo + liens */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img alt="Logo" src={logo} className="h-8 w-auto rounded-full" />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {liens.map((item) => (
                  <NavLink
                    key={item.nom}
                    to={item.chemin}
                    className={({ isActive }) =>
                      classes(
                        isActive
                          ? "bg-gray-950/50 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white",
                        "rounded-md px-3 py-2 text-sm font-medium"
                      )
                    }
                  >
                    {item.nom}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {/* Menu profil */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:ml-6 sm:pr-0">
            <Menu as="div" className="relative ml-3">
              <MenuButton className="relative flex items-center rounded-full p-1 text-gray-300 hover:text-white">
                {role === "root" ? (
                  <ShieldCheckIcon className="h-8 w-8 text-emerald-400" aria-hidden="true" />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                )}
              </MenuButton>

              <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 outline -outline-offset-1 outline-white/10">
                <MenuItem>
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Profil
                  </NavLink>
                </MenuItem>
                <MenuItem>
                  <NavLink
                    to="/parametres"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Paramètres
                  </NavLink>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={deconnexion}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Déconnexion
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {liens.map((item) => (
            <DisclosureButton
              key={item.nom}
              as={NavLink}
              to={item.chemin}
              className={({ isActive }) =>
                classes(
                  isActive
                    ? "bg-gray-950/50 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white",
                  "block rounded-md px-3 py-2 text-base font-medium"
                )
              }
            >
              {item.nom}
            </DisclosureButton>
          ))}
          <DisclosureButton
            as="button"
            onClick={deconnexion}
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5"
          >
            Déconnexion
          </DisclosureButton>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
