import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuillModule } from 'ngx-quill';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ItemQuillEditorComponent } from './item-quill-editor.component';
describe('ItemQuillEditorComponent', () => {
  let component: ItemQuillEditorComponent;
  let fixture: ComponentFixture<ItemQuillEditorComponent>;
  CommonTestingModule.setUpTestBed(ItemQuillEditorComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemQuillEditorComponent ],
      imports:[QuillModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemQuillEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
