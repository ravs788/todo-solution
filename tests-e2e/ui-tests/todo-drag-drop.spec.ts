import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { CreateTodoPage } from '../pages/CreateTodoPage';
import config from '../../config.json';

// Utility to click through pager to the last page
async function goToLastPage(homePage: HomePage) {
  while (await homePage.pagerNextButton.isEnabled()) {
    await homePage.clickPagerNext();
  }
}


