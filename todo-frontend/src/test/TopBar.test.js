import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TopBar from "../components/TopBar";

// Mock react-router-dom's useNavigate
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn()
  };
});
const { useNavigate } = require("react-router-dom");

describe("TopBar", () => {
  let navigateSpy;
  let removeItemSpy;
  let sessionClearSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateSpy = jest.fn();
    useNavigate.mockReturnValue(navigateSpy);

    // Spy on storages
    removeItemSpy = jest.spyOn(window.localStorage.__proto__, "removeItem");
    sessionClearSpy = jest.spyOn(window.sessionStorage.__proto__, "clear");

    // Seed token
    localStorage.setItem("jwtToken", "TOKEN");
    sessionStorage.setItem("x", "y");
  });

  afterEach(() => {
    removeItemSpy.mockRestore();
    sessionClearSpy.mockRestore();
    localStorage.clear();
    sessionStorage.clear();
  });

  test("Logout removes token, clears session and navigates to /login with replace", () => {
    render(<TopBar />);

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    expect(removeItemSpy).toHaveBeenCalledWith("jwtToken");
    expect(sessionClearSpy).toHaveBeenCalled();

    expect(localStorage.getItem("jwtToken")).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith("/login", { replace: true });
  });
});
