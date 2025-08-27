import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[customFormField]'
})
export class CustomFormFieldDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.addClass(this.el.nativeElement, 'custom-form-field');
  }
}