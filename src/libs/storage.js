import browser from "./browser";

async function set(key, val) {
  if (browser?.storage) {
    await browser.storage.local.set({ [key]: val });
  } else {
    const oldValue = window.localStorage.getItem(key);
    window.localStorage.setItem(key, val);
    // 手动唤起事件
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        oldValue,
        newValue: val,
      })
    );
  }
}

async function get(key) {
  if (browser?.storage) {
    const res = await browser.storage.local.get([key]);
    return res[key];
  }
  return window.localStorage.getItem(key);
}

async function del(key) {
  if (browser?.storage) {
    await browser.storage.local.remove([key]);
  } else {
    const oldValue = window.localStorage.getItem(key);
    window.localStorage.removeItem(key);
    // 手动唤起事件
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        oldValue,
        newValue: null,
      })
    );
  }
}

async function setObj(key, obj) {
  await set(key, JSON.stringify(obj));
}

async function trySetObj(key, obj) {
  if (!(await get(key))) {
    await setObj(key, obj);
  }
}

async function getObj(key) {
  const val = await get(key);
  return val && JSON.parse(val);
}

async function putObj(key, obj) {
  const cur = (await getObj(key)) ?? {};
  await setObj(key, { ...cur, ...obj });
}

/**
 * 监听storage事件
 * @param {*} handleChanged
 */
function onChanged(handleChanged) {
  if (browser?.storage) {
    browser.storage.onChanged.addListener(handleChanged);
  } else {
    window.addEventListener("storage", handleChanged);
  }
}

/**
 * 对storage的封装
 */
const storage = {
  get,
  set,
  del,
  setObj,
  trySetObj,
  getObj,
  putObj,
  onChanged,
};

export default storage;