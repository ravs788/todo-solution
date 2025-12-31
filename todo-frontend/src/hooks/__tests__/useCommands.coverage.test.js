import { createCommands } from "../useCommands";

/**
 * Mock axios instance created in useCommands via axios.create(...)
 * Expose method spies for control and assertions.
 */
jest.mock("axios", () => {
  const mockPost = jest.fn();
  const mockPut = jest.fn();
  const mockDelete = jest.fn();
  const mockPatch = jest.fn();
  const instance = {
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
    delete: (...args) => mockDelete(...args),
    patch: (...args) => mockPatch(...args),
    interceptors: { request: { use: jest.fn() } },
  };
  const create = jest.fn(() => instance);
  return {
    __esModule: true,
    default: { create },
    create,
    __mockPost: mockPost,
    __mockPut: mockPut,
    __mockDelete: mockDelete,
    __mockPatch: mockPatch,
  };
});

describe("useCommands branch coverage (error and edge paths)", () => {
  let axiosModule;
  let state;
  let setTodos;
  let showToast;

  beforeEach(() => {
    axiosModule = require("axios");
    axiosModule.__mockPost.mockReset();
    axiosModule.__mockPut.mockReset();
    axiosModule.__mockDelete.mockReset();
    axiosModule.__mockPatch.mockReset();

    // Simple mutable state + React-like setState helper
    state = [];
    setTodos = (updater) => {
      if (typeof updater === "function") {
        state = updater(state);
      } else {
        state = updater;
      }
    };
    showToast = jest.fn();

    process.env.REACT_APP_API_BASE_URL = "";
    localStorage.clear();
  });

  test("createTodoCommand success updates state and shows success toast", async () => {
    const created = { id: 101, title: "New Task", completed: false, startDate: "2023-08-12T10:00:00Z" };
    axiosModule.__mockPost.mockResolvedValueOnce({ data: created });

    const { createTodoCommand } = createCommands(setTodos, showToast);
    const cmd = createTodoCommand({ title: "New Task" });

    const result = await cmd.do();

    expect(result).toEqual(created);
    expect(axiosModule.__mockPost).toHaveBeenCalledWith("/todos", { title: "New Task" });
    expect(state).toEqual([created]);
    expect(showToast).toHaveBeenCalledWith("Todo created successfully", "success");
  });

  test("createTodoCommand error path shows error toast and rethrows", async () => {
    axiosModule.__mockPost.mockRejectedValueOnce(new Error("API Error"));

    const { createTodoCommand } = createCommands(setTodos, showToast);
    const cmd = createTodoCommand({ title: "Bad Task" });

    await expect(cmd.do()).rejects.toThrow("API Error");
    expect(showToast).toHaveBeenCalledWith("Failed to create todo", "error");
  });

  test("deleteTodoCommand error path shows error toast and rethrows", async () => {
    axiosModule.__mockDelete.mockRejectedValueOnce(new Error("Delete failed"));

    const { deleteTodoCommand } = createCommands(setTodos, showToast);
    const cmd = deleteTodoCommand(55, { title: "X", completed: false, startDate: "2023-08-12T10:00:00Z", tags: [] });

    await expect(cmd.do()).rejects.toThrow("Delete failed");
    expect(showToast).toHaveBeenCalledWith("Failed to delete todo", "error");
  });

  test("undoDelete restores todo and subsequent delete uses restored id via cmd.meta", async () => {
    // Prepare restored todo
    const restored = { id: 777, title: "Restored", completed: false, startDate: "2023-08-12T10:00:00Z" };
    axiosModule.__mockPost.mockResolvedValueOnce({ data: restored });

    const initialId = 33;
    const todoData = {
      title: "Original",
      completed: false,
      startDate: "2023-08-12T10:00:00Z",
      tags: ["t1", { name: "t2" }],
    };

    const { deleteTodoCommand } = createCommands(setTodos, showToast);
    const cmd = deleteTodoCommand(initialId, todoData);

    // Simulate undo (recreate)
    const result = await cmd.undo();
    expect(result).toEqual(restored);
    expect(state).toEqual([restored]);
    expect(showToast).toHaveBeenCalledWith("Todo deletion undone", "info", { persistent: true });

    // Now do the delete again; it should use restored.id (777), not initialId (33)
    axiosModule.__mockDelete.mockResolvedValueOnce({});
    await cmd.do();
    expect(axiosModule.__mockDelete).toHaveBeenCalledWith(`/todos/${restored.id}`);
  });

  test("toggleCompleteCommand error path shows error toast", async () => {
    axiosModule.__mockPatch.mockRejectedValueOnce(new Error("Toggle failed"));

    const { toggleCompleteCommand } = createCommands(setTodos, showToast);
    const cmd = toggleCompleteCommand(5, false); // will attempt to set completed -> true

    await expect(cmd.do()).rejects.toThrow("Toggle failed");
    expect(showToast).toHaveBeenCalledWith("Failed to update todo status", "error");
  });

  test("updateTodoCommand error path shows error toast and rethrows", async () => {
    axiosModule.__mockPut.mockRejectedValueOnce(new Error("Update failed"));

    const { updateTodoCommand } = createCommands(setTodos, showToast);
    const cmd = updateTodoCommand(9, { title: "Updated" }, { title: "Prev" });

    await expect(cmd.do()).rejects.toThrow("Update failed");
    expect(showToast).toHaveBeenCalledWith("Failed to update todo", "error");
  });

  test("undoUpdate error path shows error toast and rethrows", async () => {
    axiosModule.__mockPut.mockRejectedValueOnce(new Error("Undo update failed"));

    const { updateTodoCommand } = createCommands(setTodos, showToast);
    const cmd = updateTodoCommand(9, { title: "Updated" }, { title: "Prev" });

    await expect(cmd.undo()).rejects.toThrow("Undo update failed");
    expect(showToast).toHaveBeenCalledWith("Failed to undo todo update", "error", { persistent: true });
  });
});
