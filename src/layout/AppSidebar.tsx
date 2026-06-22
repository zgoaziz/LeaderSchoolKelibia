"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  LockIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";
import { usePermissions } from "@/hooks/usePermissions";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  module?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const allNavSections: NavSection[] = [
  {
    title: "Général",
    items: [
      { icon: <GridIcon />, name: "Dashboard", module: "dashboard", path: "/dashboard" },
    ],
  },
  {
    title: "Académique",
    items: [
      { icon: <UserCircleIcon />, name: "Étudiants", module: "students", path: "/dashboard/students" },
      { icon: <TableIcon />, name: "Classes", module: "classes", path: "/dashboard/classes" },
      { icon: <PageIcon />, name: "Professeurs", module: "teachers", path: "/dashboard/teachers" },
      { icon: <ListIcon />, name: "Matières", module: "subjects", path: "/dashboard/subjects" },
      { icon: <CalenderIcon />, name: "Emploi du temps", module: "schedule", path: "/dashboard/schedule" },
      { icon: <CalenderIcon />, name: "Absences", module: "absences", path: "/dashboard/absences" },
      { icon: <PageIcon />, name: "Cours", module: "courses", path: "/dashboard/courses" },
    ],
  },
  {
    title: "Administration",
    items: [
      { icon: <UserCircleIcon />, name: "Inscriptions", module: "enrollments", path: "/dashboard/enrollments" },
      { icon: <PieChartIcon />, name: "Paiements", module: "payments", path: "/dashboard/payments" },
      { icon: <GridIcon />, name: "Certificats", module: "certificates", path: "/dashboard/certificates" },
      { icon: <PageIcon />, name: "Formations", module: "formations", path: "/dashboard/formations" },
    ],
  },
  {
    title: "Contenu",
    items: [
      { icon: <TableIcon />, name: "Galerie", module: "gallery", path: "/dashboard/gallery" },
      { icon: <ListIcon />, name: "Témoignages", module: "testimonials", path: "/dashboard/testimonials" },
    ],
  },
  {
    title: "Système",
    items: [
      { icon: <PieChartIcon />, name: "Utilisateurs", module: "users", path: "/dashboard/users" },
      { icon: <LockIcon />, name: "Rôles", module: "roles", path: "/dashboard/roles" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { canView } = usePermissions();

  const navSections = allNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.module || canView(item.module)),
    }))
    .filter((section) => section.items.length > 0);

  const navItems = navSections.flatMap((s) => s.items);

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav: NavItem, index: number) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `main-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) =>
      prev && prev.type === "main" && prev.index === index ? null : { type: "main", index }
    );
  };

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const renderNavItem = (nav: NavItem, globalIndex: number) => {
    if (nav.subItems) {
      const key = `main-${globalIndex}`;
      const isOpen = openSubmenu?.type === "main" && openSubmenu?.index === globalIndex;
      return (
        <li key={nav.name}>
          <button
            onClick={() => handleSubmenuToggle(globalIndex)}
            className={`menu-item group ${isOpen ? "menu-item-active" : "menu-item-inactive"} cursor-pointer ${
              !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
            }`}
          >
            <span className={isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
              {nav.icon}
            </span>
            {showLabels && <span className="menu-item-text">{nav.name}</span>}
            {showLabels && (
              <ChevronDownIcon
                className={`ml-auto w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : ""}`}
              />
            )}
          </button>
          {showLabels && (
            <div
              ref={(el) => { subMenuRefs.current[key] = el; }}
              className="overflow-hidden transition-all duration-300"
              style={{ height: isOpen ? `${subMenuHeight[key]}px` : "0px" }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && <span className={`ml-auto ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>new</span>}
                        {subItem.pro && <span className={`ml-auto ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>pro</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      );
    }

    return nav.path ? (
      <li key={nav.name}>
        <Link
          href={nav.path}
          className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"} ${
            !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
          }`}
        >
          <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
            {nav.icon}
          </span>
          {showLabels && <span className="menu-item-text">{nav.name}</span>}
        </Link>
      </li>
    ) : null;
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[min(290px,85vw)]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logoleaderschool.png"
            alt="Leader School Kelibia"
            width={48}
            height={48}
            className="h-12 w-12 object-contain shrink-0"
          />
          {showLabels && (
            <div className="leading-tight">
              <div className="font-bold text-gray-800 dark:text-white text-sm">Leader School</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Kélibia</div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          {navSections.map((section, sectionIdx) => {
            const globalOffset = navSections
              .slice(0, sectionIdx)
              .reduce((acc, s) => acc + s.items.length, 0);

            return (
              <div key={section.title} className={sectionIdx > 0 ? "mt-6" : ""}>
                {/* Section label */}
                <div className={`mb-2 flex items-center ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                  {showLabels ? (
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
                      {section.title}
                    </h2>
                  ) : sectionIdx === 0 ? (
                    <HorizontaLDots />
                  ) : (
                    <div className="w-5 border-t border-gray-200 dark:border-gray-700" />
                  )}
                </div>

                <ul className="flex flex-col gap-1">
                  {section.items.map((nav, localIdx) =>
                    renderNavItem(nav, globalOffset + localIdx)
                  )}
                </ul>
              </div>
            );
          })}
        </nav>

        {showLabels ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
