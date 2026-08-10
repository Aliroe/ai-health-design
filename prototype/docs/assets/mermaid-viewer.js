/* Mermaid 图预览灯箱：点击流程图弹出可缩放/拖拽/全屏的查看窗口
 *
 * 原理：Material 渲染前 pre.mermaid 源码还在 DOM 中，本脚本在
 * DOMContentLoaded 之前（同步脚本，位于 body 末尾）用 wrapper 包裹每个
 * pre.mermaid 并缓存其源码；Material 随后会把 pre 原地替换为 closed
 * shadow DOM 的 div.mermaid（仍在 wrapper 内）。点击 wrapper 时用缓存的
 * 源码重新调用 mermaid.render 渲染大图到灯箱。
 */
(function () {
  "use strict";

  /* ---------- 1. 收集源码 + 包裹 pre ---------- */
  var sourceMap = new WeakMap(); // wrapper -> 原始 mermaid 源码

  function wrapAll() {
    var pres = document.querySelectorAll("pre.mermaid");
    pres.forEach(function (pre) {
      if (pre.__mvWrapped) return;
      pre.__mvWrapped = true;

      var code = pre.textContent || "";
      var wrapper = document.createElement("div");
      wrapper.className = "mermaid-container";
      wrapper.setAttribute("role", "button");
      wrapper.setAttribute("aria-label", "点击放大预览流程图");
      wrapper.setAttribute("title", "点击放大预览");

      var hint = document.createElement("span");
      hint.className = "mermaid-preview-hint";
      hint.textContent = "⛶ 点击放大预览";
      wrapper.appendChild(hint);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      sourceMap.set(wrapper, code);
    });
  }

  /* ---------- 2. 灯箱 ---------- */
  var lightbox = null;

  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement("div");
    lightbox.className = "mermaid-lightbox";
    lightbox.innerHTML =
      '<div class="mermaid-lightbox-toolbar">' +
      '<button type="button" data-act="zoom-out" title="缩小">−</button>' +
      '<span class="zoom-label">100%</span>' +
      '<button type="button" data-act="zoom-in" title="放大">+</button>' +
      '<button type="button" data-act="fit" title="适应窗口">⤢ 适应</button>' +
      '<span class="spacer"></span>' +
      '<button type="button" data-act="fullscreen" title="全屏">⛶ 全屏</button>' +
      '<button type="button" class="btn-close" data-act="close" title="关闭 (Esc)">✕</button>' +
      "</div>" +
      '<div class="mermaid-lightbox-stage"><div class="mermaid-lightbox-canvas"></div></div>';
    document.body.appendChild(lightbox);

    var stage = lightbox.querySelector(".mermaid-lightbox-stage");
    var canvas = lightbox.querySelector(".mermaid-lightbox-canvas");
    var label = lightbox.querySelector(".zoom-label");

    var scale = 1;
    var tx = 0,
      ty = 0;
    var dragging = false,
      startX = 0,
      startY = 0,
      startTx = 0,
      startTy = 0;

    function applyTransform() {
      canvas.style.transform =
        "translate(-50%, -50%) translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
      label.textContent = Math.round(scale * 100) + "%";
    }

    function zoomBy(factor, cx, cy) {
      var rect = stage.getBoundingClientRect();
      var px = (cx !== undefined ? cx : rect.width / 2) - rect.width / 2;
      var py = (cy !== undefined ? cy : rect.height / 2) - rect.height / 2;
      var newScale = Math.min(8, Math.max(0.05, scale * factor));
      var ratio = newScale / scale;
      tx = px - ratio * (px - tx);
      ty = py - ratio * (py - ty);
      scale = newScale;
      applyTransform();
    }

    function fit() {
      var svg = canvas.querySelector("svg");
      if (!svg) return;
      var rect = stage.getBoundingClientRect();
      var pad = 40;
      var vb = svg.viewBox && svg.viewBox.baseVal;
      var vbW = vb && vb.width ? vb.width : svg.getBoundingClientRect().width;
      var vbH = vb && vb.height ? vb.height : svg.getBoundingClientRect().height;
      if (!vbW || !vbH) return;
      scale = Math.min(1, (rect.width - pad * 2) / vbW, (rect.height - pad * 2) / vbH);
      tx = 0;
      ty = 0;
      applyTransform();
    }

    lightbox.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      var rect = stage.getBoundingClientRect();
      if (act === "zoom-in") zoomBy(1.25, rect.width / 2, rect.height / 2);
      else if (act === "zoom-out") zoomBy(0.8, rect.width / 2, rect.height / 2);
      else if (act === "fit") fit();
      else if (act === "close") close();
      else if (act === "fullscreen") {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (lightbox.requestFullscreen) lightbox.requestFullscreen();
      }
    });

    stage.addEventListener(
      "wheel",
      function (e) {
        e.preventDefault();
        var rect = stage.getBoundingClientRect();
        zoomBy(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - rect.left, e.clientY - rect.top);
      },
      { passive: false }
    );

    stage.addEventListener("pointerdown", function (e) {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startTx = tx;
      startTy = ty;
      stage.classList.add("dragging");
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      tx = startTx + (e.clientX - startX);
      ty = startTy + (e.clientY - startY);
      applyTransform();
    });
    ["pointerup", "pointercancel"].forEach(function (ev) {
      stage.addEventListener(ev, function () {
        dragging = false;
        stage.classList.remove("dragging");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("open")) close();
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });

    function close() {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      if (document.fullscreenElement === lightbox && document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    return lightbox;
  }

  /* ---------- 3. 打开灯箱 ---------- */
  function openLightbox(code) {
    var box = ensureLightbox();
    var canvas = box.querySelector(".mermaid-lightbox-canvas");
    var label = box.querySelector(".zoom-label");

    canvas.innerHTML = '<div style="padding:60px;color:#888;font-size:14px">渲染中…</div>';
    box.classList.add("open");
    document.body.style.overflow = "hidden";
    label.textContent = "…";

    mermaid
      .render("mv-preview-" + Date.now(), code)
      .then(function (res) {
        canvas.innerHTML = res.svg;
        requestAnimationFrame(fit);
      })
      .catch(function (err) {
        canvas.innerHTML =
          '<div style="padding:40px;color:#e55;font-size:14px">渲染失败：' +
          (err && err.message ? err.message : err) +
          "</div>";
        label.textContent = "-";
      });
  }

  /* ---------- 4. 绑定点击（事件委托，兼容 wrapper 动态出现） ---------- */
  function bind() {
    document.addEventListener("click", function (e) {
      var wrapper = e.target.closest(".mermaid-container");
      if (!wrapper) return;
      var code = sourceMap.get(wrapper);
      if (code) openLightbox(code);
    });
  }

  // 本脚本是同步加载（extra_javascript 位于 body 末尾），执行时 DOM 已解析完整，
  // 而 Material 的 mermaid 渲染在其 DOMContentLoaded 处理器中触发（注册早于我们），
  // 因此必须立即 wrapAll，否则 pre.mermaid 已被替换为 shadow div，源码将丢失。
  wrapAll();
  bind();

  // 兜底：若页面在 DOMContentLoaded 之后才注入新的 pre.mermaid，补一次包装
  document.addEventListener("DOMContentLoaded", wrapAll);
})();
