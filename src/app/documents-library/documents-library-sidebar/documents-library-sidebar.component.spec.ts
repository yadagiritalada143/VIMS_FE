import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { DocumentsLibrarySidebarComponent } from './documents-library-sidebar.component';

describe('DocumentsLibrarySidebarComponent', () => {
  let component: DocumentsLibrarySidebarComponent;
  let fixture: ComponentFixture<DocumentsLibrarySidebarComponent>;
  CommonTestingModule.setUpTestBed(DocumentsLibrarySidebarComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentsLibrarySidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsLibrarySidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
