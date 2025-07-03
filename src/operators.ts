import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7?module'

async function buildGraph() {
  try {
    const res = await fetch('https://rxjs.dev/guide/operators')
    const html = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const anchors = Array.from(doc.querySelectorAll('table td a'))
    const names = anchors.map(a => a.textContent?.trim()).filter(Boolean) as string[]
    const nodes = names.map((name, index) => ({ id: index, name }))

    const width = 960
    const height = 600

    const svg = d3.select('#graph').attr('width', width).attr('height', height)

    const simulation = d3.forceSimulation(nodes as any)
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.name.length * 4))

    const g = svg.append('g')

    const node = g.selectAll('g')
      .data(nodes as any)
      .enter().append('g')

    node.append('circle')
      .attr('r', (d: any) => d.name.length * 2)
      .attr('fill', 'lightblue')

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .text((d: any) => d.name)

    simulation.on('tick', () => {
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })
  } catch (err) {
    console.error('Failed to build graph', err)
  }
}

buildGraph()
