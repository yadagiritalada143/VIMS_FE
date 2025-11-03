import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsLibraryComponent } from './documents-library.component';

describe('DocumentsLibraryComponent', () => {
  let component: DocumentsLibraryComponent;
  let fixture: ComponentFixture<DocumentsLibraryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentsLibraryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
