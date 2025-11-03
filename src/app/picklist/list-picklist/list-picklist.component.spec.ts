import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListPicklistComponent } from './list-picklist.component';

describe('ListPicklistComponent', () => {
  let component: ListPicklistComponent;
  let fixture: ComponentFixture<ListPicklistComponent>;
  CommonTestingModule.setUpTestBed(ListPicklistComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListPicklistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPicklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
