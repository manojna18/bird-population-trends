<script>
  import data from "$data/data.js";
  import { scaleLinear } from "d3-scale";
  import { line } from "d3-shape";
  import { fade } from "svelte/transition";
  import { onMount, afterUpdate } from 'svelte';

  import parrotbill from "./Assets/birds/parrotbill.png";
  import eider from "./Assets/birds/kingEider.png";
  import pipit from "./Assets/birds/pipit.png";
  import blackswift from "./Assets/birds/blackswift.png";
  import duck from "./Assets/birds/duck.png";
  import sage from "./Assets/birds/sage.png";
  import warbler from "./Assets/birds/warbler.png";
  import goose from "./Assets/birds/goose.png";
  import bobo from "./Assets/birds/bobo.png";
  import bluejay from "./Assets/birds/Bluejay.png";
  import avocet from "./Assets/birds/avocet.png";
  import eagle from "./Assets/birds/eagle.png";
  import woodduck from "./Assets/birds/woodduck.png";
  import birdcall from "./Assets/birds/eagle-call.mp3";
  import "./styles.css";

  const groupColor = {
    'Aridland': '#1F2A4A',
    'Dabbling/Diving Ducks': '#2C5FD1',
    'Eastern Forest': '#5B8FE0',
    'Grassland': '#8FB8ED',
    'Sea Ducks': '#7FA8D4',
    'Waterbirds': '#8A9A4A',
    'Western Forest': '#B0629B',
    'Geese and Swans': '#4A7FA8',
    'Tipping Point': '#6B7A8F',
  };

  const groupImage = {
    'Aridland': { src: sage, caption: 'Greater sage-grouse' },
    'Dabbling/Diving Ducks': { src: duck, caption: 'Blue-winged teal' },
    'Eastern Forest': { src: warbler, caption: 'Cerulean warbler' },
    'Geese and Swans': { src: goose, caption: 'Canada goose' },
    'Grassland': { src: bobo, caption: 'Bobolink' },
    'Sea Ducks': { src: eider, caption: 'King eider' },
    'Western Forest': { src: blackswift, caption: 'Black swift' },
    'Waterbirds': { src: pipit, caption: 'American white pelican' },
    'Tipping Point': { src: parrotbill, caption: 'Maui parrotbill' },
  };

  const groupInfo = {
    'Aridland': `
      <p>These birds have lost 41% of their populations in the last 50 years. Habitat-obligate birds in the American West are facing pressures from drought, wildfires, and invasive plant species, according to the State of the Birds 2025 report by NABCI.</p>
      <p>Efforts are underway to protect birds like the Greater sage-grouse, which has seen steep declines since 1970. The bird is considered a key health indicator of the sagebrush ecosystem, a biodiversity hotspot and home to about 90 bird species.</p>
    `,
    'Dabbling/Diving Ducks': `<p>While ducks and other waterbirds have shown notable population gains due to wetland conservation efforts, the numbers are showing a downward trend recently, according to the State of the Birds 2025 report. The report draws attention to declining duck numbers in the Prairie Pothole region of the Upper Midwest. This wetland region, home to over 50% of North America's migratory waterfowl, has witnessed destruction due to agricultural development and droughts.</p>`,
    'Eastern Forest': `<p>In the last 50 years, the eastern forest region has seen an over 25% decline in bird populations. This has been attributed to development and agricultural activities.</p><p>Stabilization or modest population gains have been observed in the last decade among birds like Red-cockaded Woodpecker, Cerulean Warbler and Wood Thrush, according to NABCI.</p>`,
    'Geese and Swans': `<p>The impressive surge in geese and swan populations is mainly driven by some species like Canada Geese and Trumpter Swan. Canada Geese numbers have exploded, driven mainly by a surge in resident geese numbers, due to their adaptation to urban landscapes. Concerted conservation efforts helped restore the numbers of Trumpter Swans, which once faced dangers of extinction.</p>`,
    'Grassland': `<p>Dramatic habitat loss and climate change driven by agriculture and development have led to a sharp decline in grassland bird populations.</p><p>One in every four birds in this category has lost over 50% of its population in the last 50 years. Among these are Sprague's Pipit, Mountain Plover, and Bobolink.</p>`,
    'Sea Ducks': `<p>One in every three sea ducks is a tipping point species that has lost over 50% of its population since 1970, with projections of another 50% loss without urgent conservation efforts.</p><p>This includes birds like the King Eider and Black Scoter. These birds are vulnerable to population declines due to warming waters, climate change, and habitat loss.</p>`,
    'Western Forest': `<p>Western forest birds have experienced an 11% decline in their populations over the past five decades, and species such as the Rufous Hummingbird are approaching critical tipping points. These downward trends are closely linked to habitat disruption from increasingly severe wildfires and the broader impacts of climate change, which are altering the availability and quality of the forests these birds rely on for survival.</p>`,
    'Waterbirds': `<p>The overall waterbird population has seen a nearly 20% increase, a trend largely driven by the population growth of a few abundant species, such as pelicans. Despite this encouraging overall rise, more than one-third of waterbird species continue to experience population declines, primarily as a result of ongoing wetland loss and habitat degradation. This contrast highlights that while some species are thriving, significant conservation challenges remain for many others that depend on healthy wetland ecosystems.</p>`,
    'Tipping Point': `<p>A total of 112 bird species have been classified into red (42), orange (37), and yellow (33), categories based on population trend trajectories, threat severity, and the security of core breeding populations, according to the NABCI report.</p><p>These birds have lost over half of their populations since 1970 and are not on a path to recovery without immediate conservation interventions. Scroll to the section below for more information.</p>`,
  };

  // Right margin is wide enough to hold the endpoint label, since every
  // group's line ends at 2022 (the rightmost x position) with no room
  // to spare for the "20px right" annotation offset otherwise.
  const MARGIN = { top: 24, right: 120, bottom: 40, left: 52 };

  // The shared y-domain is sized to the seven groups whose 1970-2022 range is
  // comparable (-43% to +45%). Two categories are structurally different, not
  // just noisier, so they're excluded from the domain and clipped instead:
  // Geese and Swans surges to +800%, and Tipping Point is a derived cross-species
  // aggregate, not a peer geographic/taxonomic group, that runs deeper (-66%)
  // than any of the seven. Including either would stretch the frame and make
  // every real decline read as gentle by comparison.
  const OUTLIER_GROUPS = ['Geese and Swans', 'Tipping Point'];
  const domainPercents = data.filter(d => !OUTLIER_GROUPS.includes(d.Group)).map(d => +d.percent);
  const globalMin = Math.floor(Math.min(...domainPercents) / 10) * 10;
  const globalMax = Math.ceil(Math.max(...domainPercents) / 10) * 10;

  const yTicks = [];
  for (let v = globalMin; v <= globalMax; v += 10) yTicks.push(v);

  const xTicks = [1970, 1980, 1990, 2000, 2010, 2020];

  const getLineData = (group) => {
    return data
      .filter(d => d.Group === group)
      .map(d => ({ x: +d.Year, y: +d.percent }));
  };

  let groups = [];
  for (const d of data) {
    if (!groups.includes(d.Group)) groups.push(d.Group);
  }

  let selectedGroup = 'Aridland';

  let chartCanvas;
  let width = 800;
  let height = 500;

  $: xScale = scaleLinear().domain([1970, 2022]).range([MARGIN.left, width - MARGIN.right]);
  $: yScale = scaleLinear().domain([globalMin, globalMax]).range([height - MARGIN.bottom, MARGIN.top]);
  $: lineGenerator = line().x(d => xScale(d.x)).y(d => yScale(d.y));

  let lineData = {};
  $: if (selectedGroup && !lineData[selectedGroup]) {
    lineData[selectedGroup] = getLineData(selectedGroup);
    lineData = lineData;
  }

  // Ghost lines: the three most recently viewed groups, excluding the active one.
  let history = [];
  $: if (selectedGroup) {
    history = [selectedGroup, ...history.filter(g => g !== selectedGroup)].slice(0, 4);
  }
  $: ghosts = history.slice(1);

  $: lastPoint = lineData[selectedGroup] ? lineData[selectedGroup][lineData[selectedGroup].length - 1] : null;
  $: endpointX = lastPoint ? xScale(lastPoint.x) : 0;
  $: endpointY = lastPoint ? Math.min(Math.max(yScale(lastPoint.y), MARGIN.top), height - MARGIN.bottom) : 0;
  $: endpointLabel = lastPoint ? `${lastPoint.y > 0 ? '+' : ''}${Math.round(lastPoint.y)}%` : '';

  $: ariaLabel = lastPoint
    ? `Line chart of ${selectedGroup} population change from 1970 to 2022, a total change of ${endpointLabel}.`
    : `Line chart of bird population change from 1970 to 2022.`;

  let reduceMotion = false;
  onMount(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion = mq.matches;
    const handler = (e) => { reduceMotion = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  let pathEl;
  let showEndpoint = false;
  let lastDrawnGroup = null;
  let lastDrawnLength = null;

  // Measuring pathEl.getTotalLength() has to happen after Svelte patches the
  // path's `d` attribute to the new shape, not before. A `$:` block runs
  // during the same update cycle that computes `d`, ahead of the actual DOM
  // patch, so it was measuring the previous shape's length and applying that
  // stale dash pattern to the new (usually longer or shorter) path, leaving
  // random solid/gap chunks instead of the whole line. afterUpdate is
  // guaranteed to run once the DOM already reflects the new `d`.
  //
  // Redraw is keyed off the actual measured length, not off selectedGroup or
  // width/height: bind:clientWidth and bind:clientHeight can each resolve in
  // their own resize callback, so the raw width/height variables sometimes
  // update in the closure a tick before the $: yScale/xScale that depend on
  // them get recomputed. Comparing width/height directly missed that lag and
  // left a stale dasharray in place; comparing the measured length catches
  // every case that actually changes the path, whatever the cause.
  afterUpdate(() => {
    if (!pathEl || !lineData[selectedGroup]) return;

    const len = pathEl.getTotalLength();
    const groupChanged = selectedGroup !== lastDrawnGroup;
    const lengthChanged = lastDrawnLength === null || Math.abs(len - lastDrawnLength) > 0.5;
    if (!groupChanged && !lengthChanged) return;

    lastDrawnGroup = selectedGroup;
    lastDrawnLength = len;

    if (groupChanged && !reduceMotion) {
      showEndpoint = false;
      pathEl.style.transition = 'none';
      pathEl.style.strokeDasharray = `${len} ${len}`;
      pathEl.style.strokeDashoffset = String(len);
      pathEl.getBoundingClientRect(); // force reflow
      pathEl.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.4, 0, 0.2, 1)';
      pathEl.style.strokeDashoffset = '0';
      setTimeout(() => { showEndpoint = true; }, 900);
    } else {
      // Reduced motion, or just a length correction (resize, late layout
      // settling): keep the line fully drawn without animating.
      pathEl.style.transition = 'none';
      pathEl.style.strokeDasharray = 'none';
      pathEl.style.strokeDashoffset = '0';
      showEndpoint = true;
    }
  });

  const observe = (node) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          selectedGroup = node.getAttribute("data-group");
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);

    return {
      destroy() {
        observer.unobserve(node);
      }
    };
  };

  let fadeClass = "";
  $: if (selectedGroup) {
    fadeClass = "";
    setTimeout(() => {
      fadeClass = "fade-in";
    }, 30);
  }

  let audio;
  const playSound = () => {
    if (audio && !reduceMotion) {
      audio.currentTime = 0;
      audio.play();
    }
  };

  const text = `Three in four North American bird species are in decline`;

  const tiers = [
    {
      name: 'Red',
      color: '#C0392B',
      description: 'High vulnerability scores, dwindling population and plunging or unknown population trend.',
      examples: "Tricolored Blackbird, Baird's Sparrow",
    },
    {
      name: 'Orange',
      color: '#D68910',
      description: 'Long term population loss of over three-quarters with continued rapid declines in the last three generations.',
      examples: "Dovekie, Sprague's Pipit, King Rail",
    },
    {
      name: 'Yellow',
      color: '#D4AC0D',
      description: 'Long term population loss of over 50%, showing stability or improving trends in the last three generations.',
      examples: 'Wood Thrush, Black Scoter',
    },
  ];
</script>

<header class="masthead">
  <p class="kicker">State of the Birds 2025</p>
  <h1>Bird population trends in North America</h1>
  <p class="standfirst">A spotlight on declining bird populations over the last 50 years</p>
  <p class="byline">by <strong>Manogna Maddipatla</strong></p>
  <p class="desktop-only">This interactive visualization is best viewed on a larger screen for the full experience.</p>
</header>

<div class="flock" on:mouseenter={playSound}>
  <img src={bluejay} id="jay" alt="Blue jay" />
  <img src={eagle} id="eagle" alt="Bald eagle" />
  <img src={woodduck} id="woodduck" alt="Wood duck" />
  <img src={avocet} id="avocet" alt="American avocet" />
  <audio bind:this={audio} src={birdcall} preload="auto"></audio>
</div>

<p id="datapoint" class="pull-quote">{#each text.split('') as letter, i}<span style="animation-delay: {i * 0.035}s">{letter === ' ' ? ' ' : letter}</span>{/each}</p>

<div class="lede">
  <p>The oncoming of Spring is always an exciting time for bird watchers. Based on where you are, you might spot robins, cardinals, blue jays, and even be greeted by the distinctive honks of Canada geese calling out to their flock mid-flight. These familiar sights comfort us after a period of their stark absence in the winter. But this surface-level abundance masks a troubling truth: steep declines in bird populations are becoming more common due to habitat loss, climate change, and human activity.</p>
  <p>The North American Bird Conservation Initiative (NABCI), a coalition of renowned conservation and scientific organizations, has identified "tipping point" species that have lost over 50% of their populations in the last 50 years. This includes everything from songbirds to migratory species. While waterfowl such as Canada geese are an exception, seeing population increases due to their adaptability to urban environments, all other bird categories have seen significant declines since 1970.</p>
</div>

<div class="scrolly-wrapper">
  <div class="sticky-stage">
    <div class="chart-panel">
      <h3 class="chart-title">Y/Y population change, 1970 to 2022</h3>
      <div class="chart-canvas" bind:clientWidth={width} bind:clientHeight={height} bind:this={chartCanvas}>
        <svg viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label={ariaLabel}>
          <defs>
            <clipPath id="plot-clip">
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={Math.max(width - MARGIN.left - MARGIN.right, 0)}
                height={Math.max(height - MARGIN.top - MARGIN.bottom, 0)}
              />
            </clipPath>
          </defs>

          {#each yTicks as tick}
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={tick === 0 ? '#9DAEC4' : '#FFFFFF'}
              stroke-width="1.5"
            />
            <text class="tick-label" x={MARGIN.left - 10} y={yScale(tick)} text-anchor="end" dominant-baseline="middle">{tick}%</text>
          {/each}

          {#each xTicks as tick}
            <text class="tick-label" x={xScale(tick)} y={height - MARGIN.bottom + 20} text-anchor="middle">{tick}</text>
          {/each}

          <g clip-path="url(#plot-clip)">
            {#each ghosts as g}
              <path d={lineGenerator(getLineData(g))} fill="none" stroke="var(--ink-soft)" stroke-width="1.5" opacity="0.4" />
            {/each}

            {#if lineData[selectedGroup]}
              <path
                bind:this={pathEl}
                d={lineGenerator(lineData[selectedGroup])}
                fill="none"
                stroke={groupColor[selectedGroup]}
                stroke-width="2.5"
                stroke-linejoin="round"
                stroke-linecap="round"
                class="active-line"
              />
            {/if}
          </g>

          {#if lastPoint && showEndpoint}
            <g transition:fade={{ duration: reduceMotion ? 0 : 300 }}>
              <circle cx={endpointX} cy={endpointY} r="5" fill="var(--accent)" />
              <text x={endpointX + 20} y={endpointY + 10} class="endpoint-label" fill="var(--accent)">{endpointLabel}</text>
            </g>
          {/if}
        </svg>
      </div>
    </div>

    <div class="text-panel">
      <span class="group-tag" style="--group-color: {groupColor[selectedGroup]}">{selectedGroup}</span>
      <div class="stat-card">
        <div class="stat-card-header">
          <p>Population change since 1970: <span class="stat-card-value">{endpointLabel}</span></p>
        </div>
        <div class="stat-card-body">
          <img src={groupImage[selectedGroup].src} alt={selectedGroup} class:fade-in={fadeClass === 'fade-in'} />
          <p class="portrait-caption">{groupImage[selectedGroup].caption}</p>
        </div>
      </div>
      <div class="group-copy" class:fade-in={fadeClass === 'fade-in'}>{@html groupInfo[selectedGroup]}</div>
    </div>
  </div>

  <div class="scroll-steps">
    {#each groups as group}
      <div class="scroll-step" use:observe data-group={group}></div>
    {/each}
  </div>
</div>

<h3 id="section2Title" class="section-h2">Tipping point</h3>
<section id="section2">
  <div id="tipping-point">
    <p class="outro">112 tipping point species have lost over half of their population in the last five decades. Without urgent intervention and conservation efforts, they are on the path of continued decline, scientists say.</p>
    <table>
      <thead>
        <tr>
          <th>Urgency category</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {#each tiers as tier}
          <tr>
            <td><span class="tier-swatch" style="background: {tier.color}"></span>{tier.name}</td>
            <td>
              {tier.description}
              <span class="tier-examples">Ex: {tier.examples}</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="outro">These concerning population trends mirror the environmental shifts we all face. Understanding their story is the first step toward a more balanced future. For more information on the population trends and conservation challenges, see <a href="https://www.stateofthebirds.org/2025/">NABCI State of the Birds 2025</a>.</p>
  </div>

  <div class="flourish-section">
    <div class="flourish-intro">
      <h2 class="section-h2">Nationwide trends, mapped</h2>
      <p>Explore how each bird group's fortunes compare across every state, from steep aridland declines to the geese and swans bucking the trend.</p>
    </div>
    <div class="flourish-wrap">
      <!-- Title and subtitle are turned off in the Flourish project itself; the section header above does that job. -->
      <iframe src='https://flo.uri.sh/visualisation/22997181/embed' title='Bird population trends by state' class='flourish-embed-iframe' frameborder='0' scrolling='no' sandbox='allow-same-origin allow-forms allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'></iframe>
      <div style='width:100%;margin-top:4px;text-align:right;'><a class='flourish-credit' href='https://public.flourish.studio/visualisation/22997181/?utm_source=embed&utm_campaign=visualisation/22997181' target='_top' style='text-decoration:none'><img alt='Made with Flourish' src='https://public.flourish.studio/resources/made_with_flourish.svg' style='width:105px;height:16px;border:none;margin:0;'> </a></div>
    </div>
  </div>
</section>

<section id="footer">
  <h2>Sources</h2>
  <p>U.S. Geological Survey Eastern Ecological Science Center</p>
  <p>U.S. Fish &amp; Wildlife Service</p>
  <p>National Audubon Society</p>
  <p><a href="https://www.stateofthebirds.org/2025/">NABCI State of the Birds 2025</a></p>
  <p><a href="https://r2rbirds.org/about-us/">Road to Recovery</a></p>
</section>
