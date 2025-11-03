import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { DocumentsFoldersListComponent } from './documents-folders-list.component';

describe('DocumentsFoldersListComponent', () => {
  let component: DocumentsFoldersListComponent;
  let fixture: ComponentFixture<DocumentsFoldersListComponent>;
  CommonTestingModule.setUpTestBed(DocumentsFoldersListComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentsFoldersListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsFoldersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
