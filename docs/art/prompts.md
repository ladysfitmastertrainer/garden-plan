# Bộ prompt vẽ nhân vật bằng Gemini

Mỗi mục dưới đây là MỘT TỜ HÌNH: nhiều nhân vật đứng thành một hàng ngang trên nền
trắng. Vẽ cả dòng tiến hoá trong một tờ là để bốn nấc nhìn ra cùng một con - tạo
riêng từng nấc thì lần nào Gemini cũng vẽ ra một con hơi khác.

## Cách làm

1. Mở gemini.google.com, chọn **tạo ảnh** (Nano Banana).
2. **Đính kèm ảnh mẫu phong cách**, rồi dán NGUYÊN khối prompt (nút copy ở góc khối).
   - Mấy tờ đầu tiên: đính kèm `art-src/_style-ref.png` (cắt từ video).
   - Khi đã có một tờ ưng ý của mình, các tờ sau **đính kèm tờ đẹp nhất đó** thay cho
     ảnh video. Cả bộ sẽ đồng đều với nhau hơn, và không còn dính dáng gì tới nhân vật
     của game kia.
3. Duyệt ảnh theo danh sách dưới. Chưa đạt thì bảo Gemini sửa ("make the gap between
   the characters wider", "remove the text") hoặc tạo lại.
4. Tải ảnh về, **đổi tên đúng như dòng "Tên file"**, bỏ vào `D:\Apps\garden-plan\art-src\`.
   PNG hay JPG đều được.
5. Báo tôi, hoặc tự chạy `npm run art`. Script cắt từng con ra `public/art/` và
   in ảnh soát vào `art-src/_check/`.

## Duyệt ảnh - một tờ đạt khi

- Đủ số con, đúng thứ tự trái → phải.
- Các con **không chạm nhau**, giữa hai con có khoảng trắng rõ. Đây là điều quan trọng
  nhất: hai con dính nhau thì script không tách được.
- Nền trắng phẳng, không có sàn, không có bóng đổ dài.
- Không có chữ, không có số.
- Không con nào bị cắt mép ảnh.

## Nên làm theo thứ tự này

Nhân vật của trẻ → thú đồng hành → quái theo môn → trùm → quái theo nơi chốn. Ba nhóm
đầu xuất hiện nhiều nhất trong game. Chưa có hình thì app vẫn vẽ con đó bằng pixel cũ,
nên làm tới đâu gắn tới đó, không có tờ nào phải chờ tờ nào.

## Nhân vật của trẻ (3 tờ)

### 1. Nhân vật - Cáo Lửa

**Tên file:** `hero-fox.png` · **Thứ tự trái → phải:** mặt trước, mặt nghiêng, mặt sau

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

Character turnaround sheet of ONE hero character: a fox kid adventurer: orange fur, cream belly and muzzle, white-tipped tail, wearing a small red adventurer scarf and a tiny satchel.

Show the same character 3 times in a row: (1) FRONT view facing the viewer, (2) SIDE view walking toward the LEFT, (3) BACK view seen from behind. Same size, same pose height, standing upright, simple neutral standing pose.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 3 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 2. Nhân vật - Trúc Mập

**Tên file:** `hero-panda.png` · **Thứ tự trái → phải:** mặt trước, mặt nghiêng, mặt sau

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

Character turnaround sheet of ONE hero character: a chubby panda kid adventurer: classic black and white, wearing a small green adventurer scarf and a tiny satchel.

Show the same character 3 times in a row: (1) FRONT view facing the viewer, (2) SIDE view walking toward the LEFT, (3) BACK view seen from behind. Same size, same pose height, standing upright, simple neutral standing pose.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 3 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 3. Nhân vật - Rồng Con

**Tên file:** `hero-dragon.png` · **Thứ tự trái → phải:** mặt trước, mặt nghiêng, mặt sau

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

Character turnaround sheet of ONE hero character: a baby dragon kid adventurer: leaf-green scales, cream belly, little yellow horns, tiny wings, wearing a small blue adventurer scarf and a tiny satchel.

Show the same character 3 times in a row: (1) FRONT view facing the viewer, (2) SIDE view walking toward the LEFT, (3) BACK view seen from behind. Same size, same pose height, standing upright, simple neutral standing pose.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 3 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

## Thú đồng hành - 12 dòng tiến hoá

### 4. Sóc Số

**Tên file:** `pet-so-con.png` · **Thứ tự trái → phải:** Sóc Số → Sóc Sao Băng → Sóc Thiên Hà → Sóc Vũ Trụ

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a quick, sharp-shooting SQUIRREL.

Stage 1: tiny round baby squirrel, orange fur and cream belly, a huge fluffy curled tail with a pale plus-sign shaped marking, hugging a single abacus bead.
Stage 2: bigger young squirrel, its tail now streams behind it like a comet with a glowing trail, star-shaped tuft on the forehead.
Stage 3: confident squirrel whose tail fur turns deep navy filled with a swirl of tiny stars like a galaxy, small geometric shapes (a triangle, a cube) orbiting it.
Stage 4: majestic cosmic squirrel, an enormous cape-like tail full of starry deep-blue space and a little ringed planet, golden crown-like ear tufts.

ELEMENT THEME - "Number Magic": warm orange and amber with cream, small navy accents. Decorative motifs: plus and multiply symbol shapes, abacus beads, rulers, simple geometric solids (triangles, cubes, spheres), little star sparkles. Never draw actual digits.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 5. Rồng Số

**Tên file:** `pet-rong-so.png` · **Thứ tự trái → phải:** Rồng Số → Hoàng Kim → Bạch Kim → Vô Cực

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a big, sturdy DRAGON that breathes magic.

Stage 1: chubby baby dragon, amber-orange scales, cream belly plates, stubby little wings, two nub horns, a small puff of smoke from the nose, plus-sign shaped scales along its back.
Stage 2: young dragon with shining golden scales, longer horns, bigger wings, round abacus-bead spikes along the spine.
Stage 3: large platinum-silver and amber dragon, armored chest plates with geometric patterns, wide wings.
Stage 4: grand celestial dragon in platinum and gold, tail tip curled into a glowing infinity loop, a halo of floating geometric shapes, wings spread wide.

ELEMENT THEME - "Number Magic": warm orange and amber with cream, small navy accents. Decorative motifs: plus and multiply symbol shapes, abacus beads, rulers, simple geometric solids (triangles, cubes, spheres), little star sparkles. Never draw actual digits.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 6. Gấu Đếm

**Tên file:** `pet-gau-dem.png` · **Thứ tự trái → phải:** Gấu Đếm → Gấu Đại Số → Gấu Hàm Số → Gấu Định Lý

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a slow but super-strong BEAR.

Stage 1: round chubby bear cub, orange-brown fur, cream muzzle, a toy abacus worn like a belt, bandaged little paws.
Stage 2: sturdy young bear with big cube-shaped knuckle guards and an abacus belt with large beads.
Stage 3: big burly bear with stone-cube shoulder armor engraved with plus and multiply symbols, carrying a chunky hammer.
Stage 4: colossal guardian bear in golden-orange armor made of geometric plates, a huge hammer with a glowing triangle-shaped head, a short cape.

ELEMENT THEME - "Number Magic": warm orange and amber with cream, small navy accents. Decorative motifs: plus and multiply symbol shapes, abacus beads, rulers, simple geometric solids (triangles, cubes, spheres), little star sparkles. Never draw actual digits.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 7. Cú Chữ

**Tên file:** `pet-cu-chu.png` · **Thứ tự trái → phải:** Cú Chữ → Cú Thông Thái → Cú Bác Học → Cú Thiên Thư

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a wise OWL.

Stage 1: fluffy round baby owl, rose-pink feathers, cream face disc, enormous round eyes, a tiny quill-feather tuft on its head.
Stage 2: young owl wearing small round glasses, a rolled paper scroll tucked under one wing.
Stage 3: scholar owl wearing a traditional Vietnamese scholar hat, wing feathers patterned with ink-brush strokes, an open book floating beside it.
Stage 4: majestic owl whose wings fan out like the pages of a giant book, glowing golden pages floating around it.

ELEMENT THEME - "Word Magic": coral pink and rose red with cream and ink black. Decorative motifs: calligraphy brushes, ink swirls and splashes, paper scrolls, quill feathers, open book pages, ribbon bookmarks. Never draw actual letters or writing.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 8. Cáo Thơ

**Tên file:** `pet-cao-tho.png` · **Thứ tự trái → phải:** Cáo Thơ → Cáo Chín Vần → Cáo Trăm Vần → Cáo Ngàn Thơ

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a poet FOX.

Stage 1: baby fox, coral-pink fur, cream chest, ONE fluffy tail whose tip is ink-black like a calligraphy brush dipped in ink.
Stage 2: young fox with THREE brush-tipped tails and a small scarf.
Stage 3: elegant fox with SIX brush-tipped tails trailing swirls of ink, a scroll ribbon floating around it.
Stage 4: magnificent NINE-tailed fox, each tail a calligraphy brush leaving glowing ink strokes in the air, a soft magical aura.

ELEMENT THEME - "Word Magic": coral pink and rose red with cream and ink black. Decorative motifs: calligraphy brushes, ink swirls and splashes, paper scrolls, quill feathers, open book pages, ribbon bookmarks. Never draw actual letters or writing.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 9. Vẹt Kể

**Tên file:** `pet-vet-ke.png` · **Thứ tự trái → phải:** Vẹt Kể → Vẹt Kể Chuyện → Vẹt Truyền Thuyết → Vẹt Sử Thi

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a storyteller PARROT.

Stage 1: tiny chubby parrot chick, rose-red and cream feathers, yellow beak, teal wing tips.
Stage 2: young parrot holding a small storybook under one wing, a bouncy feather crest.
Stage 3: parrot with long tail plumes shaped like ribbon bookmarks, wearing a little cape.
Stage 4: legendary parrot with huge spread wings, long flowing tail plumes, a floating open storybook glowing gold beside it.

ELEMENT THEME - "Word Magic": coral pink and rose red with cream and ink black. Decorative motifs: calligraphy brushes, ink swirls and splashes, paper scrolls, quill feathers, open book pages, ribbon bookmarks. Never draw actual letters or writing.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 10. Chuông Con

**Tên file:** `pet-chuong-con.png` · **Thứ tự trái → phải:** Chuông Con → Chuông Vàng → Chuông Thánh Đường → Chuông Vĩnh Hằng

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a living BELL creature.

Stage 1: tiny living bell, purple bell body with a cute face on it, the round clapper peeking out below like little feet.
Stage 2: bigger purple-and-gold bell creature, its handle shaped like two little ears, musical-note markings on the rim.
Stage 3: ornate grand bell creature decorated with arched window patterns, small wings on its sides.
Stage 4: majestic eternal bell with a halo of floating smaller bells and rings of sound waves, large feathered wings.

ELEMENT THEME - "Sound Magic": purple and violet with lavender and gold accents. Decorative motifs: musical note shapes, sound-wave rings, bells, drum patterns, piano-key stripes.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 11. Mèo Hát

**Tên file:** `pet-meo-hat.png` · **Thứ tự trái → phải:** Mèo Hát → Mèo Ca Trưởng → Mèo Nhạc Trưởng → Mèo Thiên Thanh

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a singing CAT.

Stage 1: lavender-purple kitten with a cream belly, tail tip shaped like a musical note, mouth open singing happily.
Stage 2: young cat wearing a bow tie, ear tufts shaped like musical notes.
Stage 3: conductor cat in a little tailcoat waving a baton, tail striped like piano keys.
Stage 4: celestial cat with long flowing violet-and-sky-blue fur, floating musical notes and a ribbon of sound waves swirling around it.

ELEMENT THEME - "Sound Magic": purple and violet with lavender and gold accents. Decorative motifs: musical note shapes, sound-wave rings, bells, drum patterns, piano-key stripes.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 12. Trống Nhỏ

**Tên file:** `pet-trong-nho.png` · **Thứ tự trái → phải:** Trống Nhỏ → Trống Đại Hội → Trống Sấm → Trống Thiên Lôi

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a living DRUM creature.

Stage 1: small round living hand-drum, purple body with a cute face, two stubby drumstick arms.
Stage 2: big festival drum creature in red-violet and gold with tassels and decorative bands.
Stage 3: thunder drum creature with storm-cloud tufts on top and lightning-bolt shaped drumsticks.
Stage 4: heavenly thunder drum surrounded by a ring of small floating drums, crackling lightning, majestic and proud.

ELEMENT THEME - "Sound Magic": purple and violet with lavender and gold accents. Decorative motifs: musical note shapes, sound-wave rings, bells, drum patterns, piano-key stripes.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 13. Đom Sáng

**Tên file:** `pet-dom-sang.png` · **Thứ tự trái → phải:** Đom Sáng → Đom Đóm Rạng → Đom Đóm Rực → Đom Đóm Thiên Đăng

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a FIREFLY.

Stage 1: tiny round firefly bug, sky-blue body, a glowing golden belly-light, small clear wings.
Stage 2: brighter young firefly, bigger glow, antennae tipped with little lights.
Stage 3: firefly with a large glowing abdomen shaped like a lantern, four wings, sparkles around it.
Stage 4: grand sky-lantern firefly whose abdomen is an ornate Vietnamese paper lantern glowing warmly, wide luminous wings, a swarm of tiny lights around it.

ELEMENT THEME - "Light Magic": sky blue and white with warm gold accents. Decorative motifs: sun rays, halos, soft glows, lanterns, small stars and hearts.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 14. Nai Ánh Sáng

**Tên file:** `pet-nai-sang.png` · **Thứ tự trái → phải:** Nai Ánh Sáng → Nai Ánh Dương → Nai Thái Dương → Nai Vầng Dương

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a DEER of light.

Stage 1: fawn with sky-blue fur and white spots, tiny glowing golden antler nubs.
Stage 2: young deer with small golden antlers sprouting leaves of light.
Stage 3: stag with large branching glowing antlers and a mane like sun rays.
Stage 4: majestic sun stag with a golden sun disc held between its antlers, flowing mane of light, golden hooves.

ELEMENT THEME - "Light Magic": sky blue and white with warm gold accents. Decorative motifs: sun rays, halos, soft glows, lanterns, small stars and hearts.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 15. Hạc Bình Minh

**Tên file:** `pet-hac-sang.png` · **Thứ tự trái → phải:** Hạc Bình Minh → Hạc Rực Rỡ → Hạc Hừng Đông → Hạc Nhật Quang

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

This sheet is the EVOLUTION LINE of ONE single creature in 4 stages, smallest on the left to largest on the right. All four must obviously be the same species with the same color scheme, markings and eye shape; every stage is bigger, more confident and more elaborate than the one before. Stage 1 is a tiny baby about 40% the height of stage 4. Stage 4 is grand and majestic but still cute. The creature is a dawn CRANE.

Stage 1: fluffy crane chick, white and sky-blue down, a small red cap dot, short legs.
Stage 2: young crane with a longer neck, wing tips banded in sunrise orange and gold.
Stage 3: elegant crane with wing feathers in bands of dawn colors, long graceful legs.
Stage 4: radiant crane with a sun halo behind its head and long flowing tail feathers like rays of light.

ELEMENT THEME - "Light Magic": sky blue and white with warm gold accents. Decorative motifs: sun rays, halos, soft glows, lanterns, small stars and hearts.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the RIGHT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

## Quái theo môn (4 tờ)

### 16. Quái math

**Tên file:** `monsters-math.png` · **Thứ tự trái → phải:** Slime Con Số, Nhện Phép Tính, Gấu Đếm Ngược, Rô-bốt Cộng Trừ

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT small wild monsters that a child battles in a learning game. Similar size to each other.

1. a bouncy amber slime blob with little plus-sign shapes floating inside its jelly body, cheeky grin.
2. a spider whose legs look like pencils and rulers, a multiply-sign marking on its back.
3. a grumpy bear cub with a ticking hourglass strapped to its belly, arms crossed.
4. a boxy little robot with plus and minus buttons on its chest, a springy antenna, square eyes.

Palette: amber, orange, mustard and navy, slightly darker and more mischievous than the hero creatures.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 17. Quái vietnamese

**Tên file:** `monsters-vietnamese.png` · **Thứ tự trái → phải:** Cú Chữ Nghĩa, Mực Lem Luốc, Vẹt Nói Nhịu, Sách Cũ Biết Bay

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT small wild monsters that a child battles in a learning game. Similar size to each other.

1. a fussy owl wearing oversized crooked glasses, perched on a stack of books.
2. a messy ink squid leaving ink splats everywhere, ink-stained tentacles.
3. a silly cross-eyed parrot with a tangled, knotted feather crest, beak wide open mid-babble.
4. an old flying book creature with page wings, a bookmark tongue and a mischievous grin.

Palette: ink black, plum, rose and parchment cream, slightly darker and more mischievous than the hero creatures.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 18. Quái music

**Tên file:** `monsters-music.png` · **Thứ tự trái → phải:** Chuông Lạc Nhịp, Trống Ương Bướng, Sáo Ma Mãnh, Mèo Hát Sai Tông

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT small wild monsters that a child battles in a learning game. Similar size to each other.

1. a cracked wobbling bell creature with dizzy spiral eyes.
2. a stubborn drum creature with stubby arms crossed and a deep pout.
3. a sneaky snake-like flute creature with finger holes along its body and a sly grin.
4. a scruffy alley cat yowling off-key, jagged wobbly note shapes around its mouth.

Palette: deep violet, magenta and dull gold, slightly darker and more mischievous than the hero creatures.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 19. Quái ethics

**Tên file:** `monsters-ethics.png` · **Thứ tự trái → phải:** Bóng Giận Dỗi, Quỷ Lười Biếng, Sương Ích Kỷ, Bóng Tối Dối Trá

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT small wild monsters that a child battles in a learning game. Similar size to each other.

1. a sulky little storm-cloud puff, pouting with angry eyebrows, tiny lightning sparks.
2. a lazy little imp lounging on a pillow, yawning, half-closed eyes.
3. a greedy fog ghost hugging a pile of toys to itself, side-eye glance.
4. a sneaky shadow creature wearing a mask, with a long pointy nose like a fibber.

Palette: dusky indigo, slate grey and murky purple - these are the "shadow" creatures of the Light element.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

## Trùm (2 tờ)

### 20. Trùm - Rồng Số Học, Phượng Hoàng Ngôn Từ

**Tên file:** `bosses-1.png` · **Thứ tự trái → phải:** Rồng Số Học, Phượng Hoàng Ngôn Từ

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

2 DIFFERENT big boss monsters, each the final boss of a world in a learning game. Large, impressive, detailed, but still cute in this chibi style.

1. NUMBER DRAGON - a huge armored western dragon in dark amber and navy, armor made of geometric plates with plus and multiply shapes, abacus-bead spikes on its spine, wings raised.
2. PHOENIX OF WORDS - a grand phoenix with flame-like feathers of rose red and ink black, a long tail ending in unrolled paper scrolls, ink swirls rising like fire.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 2 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 21. Trùm - Long Vương Thanh Âm, Chúa Tể Bóng Đêm

**Tên file:** `bosses-2.png` · **Thứ tự trái → phải:** Long Vương Thanh Âm, Chúa Tể Bóng Đêm

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

2 DIFFERENT big boss monsters, each the final boss of a world in a learning game. Large, impressive, detailed, but still cute in this chibi style.

1. DRAGON KING OF SOUND - a long eastern-style dragon coiled upright, violet and gold, whiskers like vibrating strings, a gong on its chest, rings of sound waves around it.
2. LORD OF DARKNESS - a horned shadow lord in a billowing dark indigo cloak, glowing yellow eyes, small crown, more pompous than scary.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 2 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

## Quái theo nơi chốn (5 tờ)

### 22. Quái sea

**Tên file:** `habitat-sea.png` · **Thứ tự trái → phải:** Cá Nóc Phồng Má, Sứa Điện Lấp Lánh, Cá Kiếm Nhanh Nhảu, Cá Mập Con

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT wild creatures living in this place: Shallow sea. Similar size to each other.

1. a puffer fish with puffed-up cheeks and soft spikes.
2. a sparkly electric jellyfish with glowing tentacles and tiny sparks.
3. a speedy swordfish with a long pointed nose, streamlined and cocky.
4. a baby shark, round and chubby, showing a toothy but friendly grin.

Palette: turquoise, aqua, coral and sand.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 23. Quái cave

**Tên file:** `habitat-cave.png` · **Thứ tự trái → phải:** Cua Đá Đếm Càng, Tôm Hùm Hang, Thằn Lằn Mắt To, Rắn Hang Cuộn Tròn

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT wild creatures living in this place: Cave. Similar size to each other.

1. a rocky crab with stone-textured shell and big pincers raised.
2. a cave lobster with long antennae and pale bluish shell.
3. a lizard with enormous round eyes, clinging pose.
4. a cave snake coiled into a tidy spiral, curious face.

Palette: slate grey, moss green, pale blue and muted brown.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 24. Quái forest

**Tên file:** `habitat-forest.png` · **Thứ tự trái → phải:** Khỉ Hỏi Vặn, Sóc Bay Tinh Nghịch, Heo Rừng Húc Bậy, Hổ Con Gầm Gừ

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT wild creatures living in this place: Forest canopy. Similar size to each other.

1. a cheeky monkey scratching its head with a question-mark shaped tail curl.
2. a playful flying squirrel gliding with its skin flaps spread.
3. a rowdy wild boar charging with little tusks.
4. a tiger cub trying its best to growl, more cute than fierce.

Palette: leaf green, bark brown, orange and cream.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 25. Quái lava

**Tên file:** `habitat-lava.png` · **Thứ tự trái → phải:** Slime Dung Nham, Kỳ Nhông Lửa, Người Đá Than Hồng, Đốm Lửa Lang Thang

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT wild creatures living in this place: Volcano crater. Similar size to each other.

1. a molten lava slime with glowing orange cracks and bubbles.
2. a fire salamander with flame-tipped tail and spots like embers.
3. a chunky golem made of dark rock with glowing ember seams.
4. a wandering flame wisp, a floating teardrop of fire with a curious face.

Palette: charcoal, molten orange, red and yellow.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

### 26. Quái deep

**Tên file:** `habitat-deep.png` · **Thứ tự trái → phải:** Rắn Biển Ba Trăm Thước, Cá Voi Mặt Hồng, Xoáy Nước Nuốt Thuyền, Nhím Biển Trăm Gai

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading, proportions and color intensity. Do NOT copy any of its characters.

A line-up of 4 DIFFERENT wild creatures living in this place: Deep ocean (inspired by the sea monsters on old sea charts like Carta Marina, drawn round and cute). Similar size to each other.

1. a long sea serpent rising in loops out of a small splash of water, frilly fins.
2. a big friendly whale with rosy pink cheeks and a gentle face.
3. a living whirlpool spiral of water with big eyes and a gaping happy mouth.
4. a round sea urchin monster covered in hundreds of spikes, two big eyes peeking out.

Palette: deep navy, teal, seafoam and pink accents.

ART STYLE: polished 2D vector cartoon for a modern mobile monster-collecting game. Chibi proportions: big round head, oversized shiny eyes (large dark pupils with a white highlight), short stubby limbs, chunky rounded silhouette that reads clearly even when small. Thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no textures, no painterly brushstrokes, no 3D render, no pixel art. Bright, saturated, candy-like colors. Cute and friendly, made for children aged 6-10; even villains look mischievous, never scary or gory.

IMAGE LAYOUT (very important): wide landscape 16:9 image. Exactly 4 characters standing side by side in ONE horizontal row, left to right, on the same baseline, evenly spaced, with a wide empty white gap between neighbours. Characters must never touch or overlap, and no tail, wing, horn or effect may reach into a neighbour's column. Every character is fully visible and never cut off by the image edge. Every character is drawn in three-quarter view, body and face turned toward the LEFT side of the image. BACKGROUND: pure flat solid white (#FFFFFF), completely empty - no ground, no floor shadow, no scenery, no frame, no border. Absolutely NO text, letters, numbers, labels or signature anywhere in the image.
```

## Nền trận đấu (9 tấm)

Mỗi tấm là MỘT ảnh nền nguyên vẹn, không cắt gì cả. Không khí lấy theo ảnh tham khảo trong
`ex/`: miền quê giả tưởng ấm cúng, nhiều chi tiết nhỏ, màu đất tự nhiên, vách đá phủ rêu,
phế tích đá, đèn lồng ấm trong hang. Nhưng vẫn nét vẽ tay giống nhân vật, KHÔNG phải pixel,
vẫn nhìn ngang như trận đấu, và bỏ hết đầu lâu, máu, mộ, lồng sắt.

- **Ảnh mẫu đính kèm:** chỉ một tờ quái đẹp nhất đã làm (ví dụ `art-src/habitat-sea.png`).
  KHÔNG đính kèm ảnh trong `ex/`: đó là pixel art nhìn từ trên xuống, Gemini sẽ chép cả nét
  pixel lẫn góc nhìn. Không khí của chúng đã được tả sẵn bằng chữ trong prompt.
- **Duyệt ảnh - một tấm đạt khi:**
  - Không có con vật, người hay chữ nào.
  - Nhìn NGANG như sân đấu, không phải nhìn từ trên xuống như bản đồ.
  - Góc dưới bên trái và khoảng giữa bên phải (ngay dưới đường chân trời) để trống, chỉ có
    mặt đất trơn - đó là chỗ thú của trẻ và con quái đứng.
  - Nét viền đậm, tô màu mảng phẳng, không ra pixel.
  - Màu dịu hơn nhân vật một chút; nền chói quá thì bảo Gemini "make the colors softer".
- Tải về, đổi tên đúng dòng "Tên file", bỏ vào `art-src/` như các tờ khác rồi báo tôi.

### 27. Nền - Môn Toán - Thung lũng Con Số

**Tên file:** `scene-math.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. A sunny rocky valley. On both sides, tall cliffs of layered mossy blue-grey rock ledges stacked like giant stair steps, with pine trees and round leafy trees growing on top. A worn orange dirt path winds from the foreground into the distance, with a few old stone steps. Along the edges: smooth boulders shaped like a cube, a ball and a pyramid, an old weathered stone pillar, tufts of tall grass. Far away, pale blue mountains under a clear sky with puffy clouds.

Palette: olive and fresh greens, mossy blue-grey stone, warm orange-brown dirt, light blue sky.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```

### 28. Nền - Môn Tiếng Việt - Rừng Ngôn Từ

**Tên file:** `scene-vietnamese.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. An old, friendly woodland. Tall pine trees and big round leafy trees frame the left and right edges, their canopy meeting overhead. Soft golden sunbeams slant down through the leaves. Along the edges: the moss-covered ruins of a small crumbling stone archway, ferns curled like paper scrolls, purple lupine wildflowers, a fallen log, a blank wooden signpost. The forest floor is soft grass with patches of dirt; in the far back, the trees fade into a misty light-green glow with a hint of soft pink sky.

Palette: deep and light leafy greens, warm brown bark, mossy stone, golden light, touches of purple and pink.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```

### 29. Nền - Môn Đạo đức - Đồi Ánh Sáng

**Tên file:** `scene-ethics.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. A peaceful green hilltop in warm morning light. Along the edges: a round old stone well with a little wooden roof, a lantern hanging on a wooden post, low crumbling stone walls with moss, round bushes and wildflowers, one big shady tree. Far away, rolling hills, a small white lighthouse on a distant cliff and a calm strip of blue sea. Soft rays of light from a rising sun.

Palette: fresh greens and olive, warm sunlight yellow, cream stone, pale sky blue.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```

### 30. Nền - Môn Âm nhạc - Đảo Thanh Âm

**Tên file:** `scene-music.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. A small tropical sand cove. Turquoise sea around it with gentle waves. Along the edges: palm trees, an old wooden dock with thick posts and rope, a few wooden barrels and crates, giant seashells shaped like a horn and a drum lying on the sand, rounded rocks with seaweed. Gentle ripple lines in the sand. A few round bubbles floating up into a soft lavender sky (round bubbles only, no music symbols).

Palette: warm sand, turquoise water, weathered wood brown, coral pink, lavender sky.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```

### 31. Nền - Nơi chốn - Bãi Đảo Nước Nông

**Tên file:** `scene-sea.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. A shallow sunny lagoon. The two empty standing areas are flat pale sandbars just above clear teal water with gentle ripples. Along the edges: the end of an old stone pier with wooden mooring posts and ropes, rocks with seaweed and starfish, a small rowing boat pulled up on the sand. Small islands with palm trees on the horizon.

Palette: clear teal and aqua water, pale sand, weathered stone and wood, bright sky blue.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```

### 32. Nền - Nơi chốn - Hang Đá Vọng

**Tên file:** `scene-cave.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. Inside a big cozy cave that was once an old underground hall. Rounded rock walls and old stone-brick arches on the left and right, stalactites hanging from the top edge. Warm lanterns on the walls cast soft round pools of golden light on a smooth flat stone floor, while the corners fall into deep purple shadow. Clusters of glowing teal and violet crystals grow from the walls, a few wooden crates and clay pots sit by the edges, a small underground pool glimmers far in the back. Mysterious but cozy, never creepy.

Palette: deep purple-grey rock, warm golden lantern light, glowing teal and violet crystals, brown wood.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```

### 33. Nền - Nơi chốn - Tán Cây Cổ Thụ

**Tên file:** `scene-forest.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. High up in the treetops of a giant ancient tree. The ground is a wide flat deck of wooden planks. Along the edges: thick mossy branches, rope railings, a lantern hanging from a branch, a little treehouse roof peeking in. All around, huge round clusters of leaves; a rope bridge leads away to another tree in the far background; light-green sky and sunbeams peek through the leaves.

Palette: leafy greens, warm wood brown, mossy olive, soft yellow light.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```

### 34. Nền - Nơi chốn - Miệng Núi Lửa

**Tên file:** `scene-lava.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. Inside the rim of a cartoon volcano crater. The ground is flat dark-grey ash rock. Along the edges: layered dark rock ledges and cliffs, rounded black boulders with glowing cracks, small streams of glowing orange lava far in the background, puffs of soft grey smoke rising into a warm red-orange sky. Exciting but friendly, like a theme-park volcano, never scary.

Palette: charcoal grey, molten orange, warm red sky, yellow glow.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```

### 35. Nền - Nơi chốn - Biển Sâu

**Tên file:** `scene-deep.png`

```text
(Attach the style reference image.) Match ONLY the drawing style of the attached image - its outlines, shading and color intensity. Do NOT draw any of its characters.

Background scenery for a battle screen. The open sea far from shore under a cloudy sky with soft drizzle. Big rounded teal waves; the two empty standing areas are wide flat-topped grey rocks rising out of the water. Along the edges: a few old wooden mooring posts sticking out of the water, sea spray, floating driftwood, the broken mast of an old shipwreck far away on the horizon. Adventurous, with a light grey-blue sky, never dark or frightening.

Palette: grey-blue sky, deep teal and navy sea, seafoam white, weathered grey rock and wood.

ART STYLE: polished 2D vector cartoon background for a modern mobile monster-collecting game, made for children aged 6-10. Same line work as the attached image: thick, uniform, very dark brown outlines around every shape. Flat cel shading: one base color, one darker shadow tone and one small highlight per area - no gradients, no painterly brushstrokes, no 3D render, NO pixel art. The world feels like a cozy, lived-in fantasy RPG countryside: rich in small hand-placed details (scattered pebbles, tufts of grass, little wildflowers, moss on stones, worn dirt paths, cracked old cobblestones), but every detail is drawn with simple rounded cartoon shapes. Natural, earthy, warm palette - grass greens with olive and ochre tones, warm orange-brown dirt, mossy blue-grey stone - slightly SOFTER and less saturated than the characters, so the creatures that will stand here pop out clearly in front of it. Cheerful and safe: no skulls, bones, graves, blood, cages, weapons or anything scary.

IMAGE LAYOUT (very important): wide landscape 16:9 image, an empty battle stage seen from the side with the camera slightly raised, like the battle screen of a classic monster-collecting game - NOT a top-down map. The horizon line sits at about 45% of the image height: sky or far scenery above it, ground below it, the ground stretching back in gentle perspective. Keep TWO areas plain, flat and empty, because two creatures will be drawn on top of them later: (1) the lower-left quarter of the image, the near foreground; (2) the middle-right area just below the horizon, the far ground. In those two areas put only plain walkable ground (short grass, packed dirt or smooth stone) - no objects, plants, rocks, puddles or patterns. All the rich detail goes along the left and right edges, in the far background and in the sky, framing the stage. The image will be cropped a little on any side depending on the screen, so nothing important may touch the edges. Absolutely NO characters, creatures, animals or people. Absolutely NO text, letters, numbers, runes, signs with writing, labels, UI, frame, border or signature anywhere in the image.
```
