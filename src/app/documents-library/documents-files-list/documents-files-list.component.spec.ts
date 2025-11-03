import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { DocumentsFilesListComponent } from './documents-files-list.component';

describe('DocumentsFilesListComponent', () => {
  let component: DocumentsFilesListComponent;
  let fixture: ComponentFixture<DocumentsFilesListComponent>;
  CommonTestingModule.setUpTestBed(DocumentsFilesListComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentsFilesListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsFilesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
