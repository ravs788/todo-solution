import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Toast/Popup notifications that contain Undo/Redo.
 */
export class UndoRedoToastPage {
  readonly page: Page;
  readonly toastRegion: Locator;
  readonly undoToast: Locator;
  readonly undoButton: Locator;
  readonly redoToast: Locator;
  readonly redoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toastRegion = page.locator('[role="region"][aria-label="Toast notifications"]').first();
    // Undo/Redo buttons in toast body, prefer generic text match
    this.undoToast = this.toastRegion.filter({ hasText: 'undone' }).or(this.toastRegion.filter({ hasText: 'deleted successfully' }));
    // If there are multiple Undo buttons, always pick the first (strict mode violation otherwise)
    this.undoButton = this.toastRegion.getByRole('button', { name: /undo/i }).first();
    this.redoToast = this.toastRegion.filter({ hasText: /redo/i });
    this.redoButton = this.toastRegion.getByRole('button', { name: /redo/i });
  }

  async waitForUndoToast(timeout = 8000) {
    // Wait up to timeout but check every 200ms for up to 15 repeats, since toast may hide quickly if not pinned
    let appeared = false;
    for (let i = 0; i < timeout / 200; ++i) {
      if (await this.toastRegion.isVisible() && await this.undoButton.isVisible()) {
        appeared = true;
        break;
      }
      await this.page.waitForTimeout(200);
    }
    if (!appeared) {
      throw new Error('Undo toast not found or visible before timeout (likely autohidden)');
    }
  }

  async clickUndo() {
    // Try to click Undo with all fallback options.
    try {
      await this.undoButton.click({ trial: true });
      await this.undoButton.click();
    } catch (err1) {
      try {
        await this.undoButton.click({ force: true });
      } catch (err2) {
        try {
          await this.page.evaluate(el => (el as HTMLElement).click(), await this.undoButton.elementHandle());
        } catch (err3) {
          // Fallback: try click on any visible button mentioning "Undo"
          const altBtn = this.page.getByRole('button', { name: /undo/i }).first();
          try {
            await altBtn.click({ force: true });
          } catch (err4) {
            throw new Error(
              'Failed to click Undo: tried normal, force, eval, alt selector. Error: ' +
                err1?.message +
                '; ' +
                err2?.message +
                '; ' +
                err3?.message +
                '; ' +
                err4?.message
            );
          }
        }
      }
    }
  }

  async waitForRedoToast(timeout = 8000) {
    await this.toastRegion.waitFor({ state: 'visible', timeout });
    await this.redoButton.waitFor({ state: 'visible', timeout });
  }

  async clickRedo() {
    await this.redoButton.click();
  }
}
