import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RowRendererComponent } from '../row-renderer/row-renderer.component';
import { TemplateDesignerComponent } from './template-designer.component';

describe('TemplateDesignerComponent', () => {
  let component: TemplateDesignerComponent;
  let fixture: ComponentFixture<TemplateDesignerComponent>;
  CommonTestingModule.setUpTestBed(TemplateDesignerComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TemplateDesignerComponent,RowRendererComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
