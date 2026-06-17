import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import mermaid from 'mermaid';

@Component({
  selector: 'app-docs-projeto',
  imports: [CommonModule],
  templateUrl: './docs-projeto.html',
  styleUrl: './docs-projeto.css',
})
export class DocsProjeto implements OnInit {
  @ViewChild('content') private content?: ElementRef<HTMLElement>;

  protected html?: SafeHtml;
  protected errorMessage = '';

  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'default',
    });

    this.http
      .get('/docs-projeto/guia_visual.md', { responseType: 'text' })
      .subscribe({
        next: (markdown) => {
          try {
            const rendered = marked.parse(markdown, { gfm: true }) as string;

            this.html = this.sanitizer.bypassSecurityTrustHtml(
              this.resolveDocsImagePaths(rendered)
            );
            this.cdr.detectChanges();

            requestAnimationFrame(() => this.renderMermaidBlocks());
          } catch (error) {
            console.error(error);
            this.errorMessage = 'Não foi possível renderizar o guia visual.';
          }
        },
        error: () => {
          this.errorMessage = 'Não foi possível carregar o guia visual.';
        },
      });
  }

  private resolveDocsImagePaths(html: string): string {
    return html.replaceAll('src="prints-simulacao/', 'src="/docs-projeto/prints-simulacao/');
  }

  private async renderMermaidBlocks(): Promise<void> {
    const host = this.content?.nativeElement;

    if (!host) {
      return;
    }

    const blocks = Array.from(
      host.querySelectorAll<HTMLElement>('pre code.language-mermaid')
    );

    blocks.forEach((block) => {
      const diagram = document.createElement('div');
      diagram.className = 'mermaid';
      diagram.textContent = block.textContent ?? '';
      block.closest('pre')?.replaceWith(diagram);
    });

    await mermaid.run({
      nodes: host.querySelectorAll<HTMLElement>('.mermaid'),
    });
  }
}
