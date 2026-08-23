"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import type { TenantMember } from "@/lib/tenants-api";

type TenantMemberActionsProps = {
  member: TenantMember;

  onView: (member: TenantMember) => void;

  onRemove: (member: TenantMember) => void;
};

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 224;
const MENU_GAP = 6;
const VIEWPORT_PADDING = 8;

export function TenantMemberActions({
  member,
  onView,
  onRemove,
}: TenantMemberActionsProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  function updateMenuPosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();

    const menuHeight = menuRef.current?.offsetHeight ?? 180;

    let left = rect.right - MENU_WIDTH;

    let top = rect.bottom + MENU_GAP;

    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    if (left + MENU_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING;
    }

    const spaceBelow = window.innerHeight - rect.bottom;

    const spaceAbove = rect.top;

    if (
      spaceBelow < menuHeight + MENU_GAP &&
      spaceAbove >= menuHeight + MENU_GAP
    ) {
      top = rect.top - menuHeight - MENU_GAP;
    }

    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
    }

    if (top + menuHeight > window.innerHeight - VIEWPORT_PADDING) {
      top = window.innerHeight - menuHeight - VIEWPORT_PADDING;
    }

    setMenuPosition({
      top,
      left,
    });
  }

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);

    requestAnimationFrame(() => {
      updateMenuPosition();
    });
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      updateMenuPosition();
    });

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target)) {
        return;
      }

      if (menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleScroll() {
      updateMenuPosition();
    }

    function handleResize() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);

    window.addEventListener("scroll", handleScroll, true);

    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);

      window.removeEventListener("scroll", handleScroll, true);

      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function handleView() {
    closeMenu();
    onView(member);
  }

  function handleRemove() {
    closeMenu();
    onRemove(member);
  }

  if (!mounted) {
    return (
      <div className="flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          aria-label={`Actions for ${member.user.email}`}
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-[var(--border)]
            bg-[var(--surface)]
            text-lg
            text-[var(--foreground-muted)]
          "
        >
          ⋮
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          aria-label={`Actions for ${member.user.email}`}
          aria-expanded={open}
          onClick={toggleMenu}
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-[var(--border)]
            bg-[var(--surface)]
            text-lg
            leading-none
            text-[var(--foreground-muted)]
            transition
            hover:bg-[var(--background)]
            hover:text-[var(--foreground)]
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--primary)]/20
          "
        >
          ⋮
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="
              fixed
              z-[99999]
              w-56
              overflow-hidden
              rounded-xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-1
              shadow-xl
            "
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleView}
              className="menu-item"
            >
              <span className="menu-icon">◉</span>

              <span>View Member</span>
            </button>

            <div className="my-1 border-t border-[var(--border)]" />

            <button
              type="button"
              role="menuitem"
              onClick={handleRemove}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-left
                text-sm
                text-[var(--danger)]
                transition
                hover:bg-[var(--danger-soft)]
              "
            >
              <span className="flex w-5 justify-center">🗑</span>

              <span>Remove from Tenant</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
