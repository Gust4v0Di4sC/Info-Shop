import { ElementRef, Renderer2 } from '@angular/core';

import { CustomFormFieldDirective } from './custom-form-field.directive';

describe('CustomFormFieldDirective', () => {
  it('should add the custom form field class', () => {
    const elementRef = new ElementRef(document.createElement('input'));
    const renderer = jasmine.createSpyObj<Renderer2>('Renderer2', ['addClass']);
    const directive = new CustomFormFieldDirective(elementRef, renderer);

    expect(directive).toBeTruthy();
    expect(renderer.addClass).toHaveBeenCalledWith(elementRef.nativeElement, 'custom-form-field');
  });
});
