import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { PicklistTableComponent } from './picklist-table.component';

describe('PicklistTableComponent', () => {
  let component: PicklistTableComponent;
  let fixture: ComponentFixture<PicklistTableComponent>;
  CommonTestingModule.setUpTestBed(PicklistTableComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PicklistTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PicklistTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
