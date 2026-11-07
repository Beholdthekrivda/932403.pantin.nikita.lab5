"use strict";

/* ЛР №5. Вариант 8 «Кулинар и фуд-блогер»
   DOM, события и сохранение состояния в localStorage. */

const STORAGE_KEYS = {
  recipes: "lab5.recipes",
  theme: "lab5.theme",
  collapsed: "lab5.recipesCollapsed",
};

const THEMES = {
  light: { className: "theme-light", buttonText: "Тёмная тема", pressed: false },
  dark: { className: "theme-dark", buttonText: "Светлая тема", pressed: true },
};

// Рецепты, которые показываются при самом первом открытии страницы
const DEFAULT_RECIPES = [
  { id: "default-1", title: "Плов с морковью", ingredients: ["рис", "морковь", "лук", "растительное масло"] },
  { id: "default-2", title: "Борщ из лука", ingredients: ["лук", "капуста", "томатная паста"] },
];

/* ---------- Безопасная работа с localStorage ---------- */

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Не удалось сохранить "${key}" в localStorage:`, error);
  }
}

// Возвращает null, если данных нет или они повреждены
function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (error) {
    console.error(`Не удалось прочитать "${key}" из localStorage:`, error);
    return null;
  }
}

function isValidRecipe(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    Array.isArray(item.ingredients) &&
    item.ingredients.every((ing) => typeof ing === "string")
  );
}

/* ---------- Состояние ---------- */

let recipes = [];

function saveRecipes() {
  saveToStorage(STORAGE_KEYS.recipes, recipes);
}

/* ---------- Инициализация ---------- */

function init() {
  // Поиск элементов: getElementById и querySelector
  const elements = {
    addBtn: document.getElementById("add-recipe-btn"),
    removeLastBtn: document.getElementById("remove-last-btn"),
    toggleBtn: document.getElementById("toggle-recipes-btn"),
    themeBtn: document.getElementById("theme-btn"),
    list: document.querySelector("#recipes .recipes-list"),
    emptyNote: document.querySelector("#recipes .empty-note"),
  };

  const selectors = {
    addBtn: "#add-recipe-btn",
    removeLastBtn: "#remove-last-btn",
    toggleBtn: "#toggle-recipes-btn",
    themeBtn: "#theme-btn",
    list: "#recipes .recipes-list",
    emptyNote: "#recipes .empty-note",
  };

  // Проверка существования: если чего-то нет — логируем и не выполняем скрипт
  let allFound = true;
  for (const name in elements) {
    if (!elements[name]) {
      console.error(`Элемент не найден: ${selectors[name]}`);
      allFound = false;
    }
  }
  if (!allFound) {
    return;
  }

  const { addBtn, removeLastBtn, toggleBtn, themeBtn, list, emptyNote } = elements;

  /* ----- Тема ----- */

  function applyTheme(name) {
    const theme = THEMES[name] || THEMES.light;
    document.body.classList.remove(THEMES.light.className, THEMES.dark.className);
    document.body.classList.add(theme.className);
    themeBtn.textContent = theme.buttonText;
    themeBtn.setAttribute("aria-pressed", String(theme.pressed));
  }

  function toggleTheme() {
    const isDark = document.body.classList.contains(THEMES.dark.className);
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    saveToStorage(STORAGE_KEYS.theme, next);
  }

  /* ----- Сворачивание списка ----- */

  function setCollapsed(collapsed) {
    list.classList.toggle("hidden", collapsed);
    toggleBtn.textContent = collapsed ? "Развернуть рецепты" : "Свернуть рецепты";
    toggleBtn.setAttribute("aria-expanded", String(!collapsed));
    saveToStorage(STORAGE_KEYS.collapsed, collapsed);
  }

  function toggleCollapsed() {
    setCollapsed(!list.classList.contains("hidden"));
  }

  /* ----- Карточки ----- */

  // Подсказка «рецептов нет» показывается, только если карточек нет
  function updateEmptyNote() {
    const cards = list.querySelectorAll(".recipe-card");
    emptyNote.classList.toggle("hidden", cards.length > 0);
  }

  function createRecipeCard(recipe) {
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.dataset.id = recipe.id;

    const title = document.createElement("h3");
    title.textContent = recipe.title;

    const label = document.createElement("p");
    label.className = "recipe-label";
    label.textContent = "Ингредиенты:";

    const ul = document.createElement("ul");
    recipe.ingredients.forEach((ingredient) => {
      const li = document.createElement("li");
      li.textContent = ingredient;
      ul.appendChild(li);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-secondary";
    deleteBtn.textContent = "Удалить";
    deleteBtn.setAttribute("aria-label", `Удалить рецепт «${recipe.title}»`);
    deleteBtn.addEventListener("click", () => deleteRecipe(card));

    card.append(title, label, ul, deleteBtn);
    return card;
  }

  function deleteRecipe(card) {
    if (!card) {
      console.error("Карточка для удаления не найдена");
      return;
    }
    const id = card.dataset.id;
    recipes = recipes.filter((recipe) => recipe.id !== id);
    card.remove();
    saveRecipes();
    updateEmptyNote();
  }

  function addRecipe() {
    const titleInput = prompt("Название рецепта:");
    if (titleInput === null) {
      return; // нажата «Отмена»
    }
    const title = titleInput.trim();
    if (title === "") {
      alert("Название рецепта не может быть пустым");
      return;
    }

    const ingredientsInput = prompt("Ингредиенты (через запятую):");
    if (ingredientsInput === null) {
      return;
    }
    const ingredients = ingredientsInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    if (ingredients.length === 0) {
      alert("Укажите хотя бы один ингредиент");
      return;
    }

    const recipe = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      ingredients,
    };

    recipes.push(recipe);
    list.appendChild(createRecipeCard(recipe));
    saveRecipes();
    updateEmptyNote();

    // Если список был свёрнут — разворачиваем, чтобы было видно новую карточку
    if (list.classList.contains("hidden")) {
      setCollapsed(false);
    }
  }

  function removeLastRecipe() {
    const cards = list.querySelectorAll(".recipe-card");
    if (cards.length === 0) {
      console.log("Нет рецептов для удаления");
      alert("Список пуст");
      return;
    }
    deleteRecipe(cards[cards.length - 1]);
  }

  /* ----- Восстановление состояния ----- */

  function restoreState() {
    const savedTheme = loadFromStorage(STORAGE_KEYS.theme);
    applyTheme(savedTheme === "dark" ? "dark" : "light");

    const saved = loadFromStorage(STORAGE_KEYS.recipes);
    // Нет данных (первый визит) — показываем примеры.
    // Пустой массив означает, что пользователь сам всё удалил.
    recipes = Array.isArray(saved) ? saved.filter(isValidRecipe) : DEFAULT_RECIPES.slice();

    recipes.forEach((recipe) => list.appendChild(createRecipeCard(recipe)));
    saveRecipes();
    updateEmptyNote();

    setCollapsed(loadFromStorage(STORAGE_KEYS.collapsed) === true);
  }

  /* ----- Обработчики ----- */

  addBtn.addEventListener("click", addRecipe);
  removeLastBtn.addEventListener("click", removeLastRecipe);
  toggleBtn.addEventListener("click", toggleCollapsed);
  themeBtn.addEventListener("click", toggleTheme);

  restoreState();
}

init();
