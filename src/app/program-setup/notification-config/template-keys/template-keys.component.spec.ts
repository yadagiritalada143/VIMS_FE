import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { TemplateKeysComponent } from './template-keys.component';

describe('TemplateKeysComponent', () => {
  let component: TemplateKeysComponent;
  let fixture: ComponentFixture<TemplateKeysComponent>;
  CommonTestingModule.setUpTestBed(TemplateKeysComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TemplateKeysComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
