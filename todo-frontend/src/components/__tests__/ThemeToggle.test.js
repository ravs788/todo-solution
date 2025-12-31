import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "../ThemeToggle";
import * as ThemeContext from "../../context/ThemeContext";

const { ThemeProvider } = ThemeContext;

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    // JSDOM does not implement CSS variables, but we can still assert inline style string
    document.documentElement.removeAttribute("data-theme");
    jest.clearAllMocks();
  });

  describe("with real ThemeProvider (integration/coverage)", () => {
    function renderWithProvider(ui) {
      return render(<ThemeProvider>{ui}</ThemeProvider>);
    }

    test("renders moon when darkMode is false (default) and toggles to sun on click", () => {
      // darkMode defaults to false (no localStorage value)
      renderWithProvider(<ThemeToggle />);

      // Initial: light mode -> moon icon and switch-to-dark labels
      const btn = screen.getByRole("button", { name: /Switch to dark mode/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent("🌙");

      // Click: toggles to dark mode -> sun icon and switch-to-light labels
      fireEvent.click(btn);

      const toggled = screen.getByRole("button", { name: /Switch to light mode/i });
      expect(toggled).toBeInTheDocument();
      expect(toggled).toHaveTextContent("☀️");

      // ThemeProvider sets data-theme attribute as a side effect
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    test("respects localStorage preset: starts in dark mode and toggles back to light", () => {
      localStorage.setItem("darkMode", JSON.stringify(true));

      renderWithProvider(<ThemeToggle />);

      // Initial from storage: dark -> sun icon
      const btn = screen.getByRole("button", { name: /Switch to light mode/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent("☀️");
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

      // Toggle back to light
      fireEvent.click(btn);
      const lightBtn = screen.getByRole("button", { name: /Switch to dark mode/i });
      expect(lightBtn).toBeInTheDocument();
      expect(lightBtn).toHaveTextContent("🌙");
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    test("accepts colorVar prop without errors (style var may not serialize in JSDOM)", () => {
      renderWithProvider(<ThemeToggle colorVar="--my-custom" />);
      const btn = screen.getByRole("button");
      // JSDOM may omit var() from serialized inline styles; just ensure component renders
      expect(btn).toBeInTheDocument();
    });
  });

  describe("with mocked useTheme (hoisted and mocked coverage)", () => {
    beforeAll(() => {
      jest.spyOn(ThemeContext, "useTheme");
    });

    beforeEach(() => {
      ThemeContext.useTheme.mockReset();
    });
    test("isDarkMode=false branch: shows moon and 'Switch to dark mode', clicking calls toggleTheme (default colorVar)", () => {
      const toggleTheme = jest.fn();
      ThemeContext.useTheme.mockReturnValue({ isDarkMode: false, toggleTheme });

      render(<ThemeToggle />); // use default colorVar to exercise default param branch

      const btn = screen.getByRole("button", { name: /Switch to dark mode/i });
      expect(btn).toHaveTextContent("🌙");

      fireEvent.click(btn);
      expect(toggleTheme).toHaveBeenCalledTimes(1);
    });

    test("isDarkMode=true branch: shows sun and 'Switch to light mode' (explicit colorVar)", () => {
      ThemeContext.useTheme.mockReturnValue({ isDarkMode: true, toggleTheme: jest.fn() });

      render(<ThemeToggle colorVar="--custom" />); // pass explicit prop to execute non-default path

      const btn = screen.getByRole("button", { name: /Switch to light mode/i });
      expect(btn).toHaveTextContent("☀️");
    });

    test("when isDarkMode=false it renders moon and clicking invokes toggleTheme (default colorVar)", () => {
      const toggleTheme = jest.fn();
      ThemeContext.useTheme.mockReturnValue({ isDarkMode: false, toggleTheme });

      render(<ThemeToggle />);

      const btn = screen.getByRole("button", { name: /Switch to dark mode/i });
      expect(btn).toHaveTextContent("🌙");

      fireEvent.click(btn);
      expect(toggleTheme).toHaveBeenCalledTimes(1);
    });

    test("when isDarkMode=true it renders sun and shows switch-to-light labels (explicit colorVar)", () => {
      ThemeContext.useTheme.mockReturnValue({ isDarkMode: true, toggleTheme: jest.fn() });

      render(<ThemeToggle colorVar="--explicit" />);

      const btn = screen.getByRole("button", { name: /Switch to light mode/i });
      expect(btn).toHaveTextContent("☀️");
    });
  });
});
